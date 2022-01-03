/**
 * Select the 'wav' extension.
 */
registerFileType((fileExt, filePath, fileData) => {
	// Check for wav extension
	if (fileExt == 'wav') {
		const headerArray = fileData.getBytesAt(0, 4);
		const header = String.fromCharCode(...headerArray)
		if (header == 'RIFF')
			return true;
	}
	return false;
});


/**
 * Parser for WAV files.
 * This parser is able to read the test binary files, mono.wav and stereo.wav.
 * It may or may not read other wav files.
 * Purpose of the parser is to demonstrate the parser features.
 * It is not a complete wav parsing implementation.
 */
registerParser(() => {
	// Parse
	read(4);
	addRow('RIFF id', getHexValue(), 'RIFF file description header');

	read(4);
	addRow('File size', getNumberValue(), 'The file size LESS the size of the "RIFF" description (4 bytes) and the size of file description (4 bytes).');

	read(4);
	addRow('WAV id', getStringValue(), 'The WAV description header');

	read(4);
	addRow('fmt id', getStringValue(), 'fmt description header');

	read(4);
	addRow('size of WAV section chunk', getNumberValue(), 'The size of the WAV type format (2 bytes) + mono/stereo flag (2 bytes) + sample rate (4 bytes) + bytes/sec (4 bytes) + block alignment (2 bytes) + bits/sample (2 bytes). This is usually 16.');

	read(2);
	addRow('WAV type format', getDecimalValue(), 'Type of WAV format. This is a PCM header, or a value of 0x01.');

	read(2);
	const countChannels = getNumberValue();
	addRow('Mono/stereo', countChannels, 'mono (0x01) or stereo (0x02). The number of channels.');

	read(4);
	addRow('Freq', getDecimalValue(), 'The sample frequency.');

	read(4);
	addRow('Bytes/sec', getDecimalValue(), 'The audio data rate in bytes/sec.');

	read(2);
	addRow('Block alignment.', getDecimalValue());

	read(2);
	const bitsPerSample = getNumberValue();
	addRow('Bits per sample', bitsPerSample);

	read(4);
	addRow('Data description header', getStringValue());

	read(4);
	const dataSize = getNumberValue();
	addRow('Size of the data chunk', dataSize, 'Number of bytes of data is included in the data section.');

	read(dataSize / 4);
	const channels = [];
	const bytesPerSample = bitsPerSample / 8;

	for (let ch = 0; ch < countChannels; ch++) {
		const offs = ch * bytesPerSample;
		const skip = (countChannels - 1) * bytesPerSample;
		const samples = getData(2, offs, 'i', skip);
		channels.push(samples);
	}
	addRow('Samples', undefined, 'The samples of the wav file.');
	addDetails(() => {
		addChart({
			type: 'line',
			series: channels
		}, 'Samples');
	}, true);

});


