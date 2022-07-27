/**
 * Selects the 'obj' extension.
 */
registerFileType((fileExt, filePath, data) => {
	// Check for obj
	if (fileExt == 'obj')
		return true;
	return false;
});



/**
 * Parser for obj files.
 * This parser just demonstrates the very basics of the parsing commands.
 */
registerParser(() => {

	addStandardHeader();

	read(2);
	addRow('WORD 1', getHexValue());

	read(2);
	addRow('WORD 2', getHexValue());

	read(1);
	addRow('BYTE 1', getHexValue());

	read(1);
	addRow('Flags', getHex0xValue());
	addDetails(() => {
		readBits(1);
		addRow('Flag 0', getNumberValue(), 'Bit 0');
		readBits(3);
		addRow('Count', getDecimalValue(), 'Bits 1-3');
		readBits(4);
		addRow('Reserved');
	}, true);

	read(2);
	addRow('As hex', getHex0xValue());
	addRow('As signed (positive)', getSignedNumberValue());
	read(2);
	addRow('As hex', getHex0xValue());
	addRow('As signed (negative)', getSignedNumberValue());
});


