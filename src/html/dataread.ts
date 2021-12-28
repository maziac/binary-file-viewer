

/**
 * This js script file collects functions to read the data form the file.
 */


// The data to parse.
var dataBuffer: Uint8Array;

// Index into dataBuffer.
var lastOffset: number;

// The last retrieved data size.
var lastSize: number;

// The startOffset for relative indices (detailsParsing.)
// Is used only for displaying.
var startOffset: number;


/**
 * Returns the relative index used for displaying inside collapsed sections.
 */
function getRelOffset(): number {
	return lastOffset - startOffset;
}


/**
 * Convert array to base 64 string.
 */
function arrayBufferToBase64(buffer: any) {
	var binary = '';
	var bytes = [].slice.call(new Uint8Array(buffer));
	bytes.forEach((b: any) => binary += String.fromCharCode(b));
	return window.btoa(binary);
}


/**
 * Converts the given number value into a hex string.
 * @param value The value to convert.
 * @param size The number of digits (e.g. 2 or 4)
 * @returns E.g. "0F" or "12FA"
 */
function convertToHexString(value: number, size: number): string {
	if (value == undefined)
		return "".padStart(size, '?');
	const s = value.toString(16).toUpperCase().padStart(size, '0');
	return s;
}


/**
 * Advances the offset (from previous call) and
 * stores the size for reading.
 * @param size The number of bytes to read. // TODO: allow undefined to read everything till end of file.
 */
function read(size: number) {
	lastOffset += lastSize;	// TODO: Check if bigger than file size. Then limit to file size.
	lastSize = size;
}


/**
 * Reads in a chunk of data. E.g. to display later in Charts.
 * @param sampleSize The size of each data value (sample) in bytes.
 * @param offset The starting offset in bytes.
 * @param format 'u'=unsigned, 'i'=signed
 * @param skip The number of bytes to skip after each read sample.
 * @returns The samples in a number array.
 */
function getData(sampleSize: number, offset: number, format: string, skip: number): number[] {
	const data: number[] = [];
	const step = sampleSize + skip;
	const signed = (format == 'i');
	const max = 0x01 << (sampleSize * 8);
	const maxHalf = max / 2;
	const totalOffset = lastOffset + offset;
	const end = lastOffset + lastSize;
	for (let i = totalOffset; i < end; i += step) {
		// Read all bytes of sample
		let value = dataBuffer[i];
		let factor = 1;
		for (let k = 1; k < sampleSize; k++) {
			factor *= 256;
			value += factor * dataBuffer[i + k];
		}
		// Convert to signed, if necessary
		if (signed) {
			if (value >= maxHalf)
				value -= max;
		}
		// Store
		data.push(value);
	}
	return data;
}


/**
 * Reads the value from the buffer.
 */
function getNumberValue(): number {
	let value = dataBuffer[lastOffset];
	let factor = 1;
	for (let i = 1; i < lastSize; i++) {
		factor *= 256;
		value += factor * dataBuffer[lastOffset + i];
	}
	return value;
}


/**
 * @returns The value from the dataBuffer as decimal string.
 */
function getDecimalValue(): string {
	const val = getNumberValue();
	return val.toString();
}


/**
 * @returns The value from the dataBuffer as hex string.
 */
function getHexValue(): string {
	const val = getNumberValue();
	let s = val.toString(16).toUpperCase();
	s = s.padStart(lastSize * 2, '0');
	return s;
}


/**
 * @returns The value from the dataBuffer as hex string + "0x" in front.
 */
function getHex0xValue(): string {
	return '0x' + getHexValue();
}


/**
 * @param bit The bit to test
 * @returns The bit value (0 or 1) from the dataBuffer as string.
 */
function bitValue(bit: number): string {
	const val = getNumberValue();
	const result = (val & (1 << bit)) ? '1' : '0';
	return result;
}


/**
 * Converts a value into a bit string.
 * @param value The value to convert.
 * @param size The size of the value, e.g. 1 byte o r 2 bytes.
 * @returns The value from the dataBuffer as bit string. e.g. "0011_0101"
 */
function convertBitsToString(value: number, size: number): string {
	let s = value.toString(2);
	s = s.padStart(size * 8, '0');
	s = s.replace(/.{4}/g, '$&_');
	// Remove last '_'
	s = s.substr(0, s.length - 1);
	return s;
}

/**
 * @returns The value from the dataBuffer as bit string. e.g. "0011_0101"
 */
function bitsValue(): string {
	const val = getNumberValue();
	return convertBitsToString(val, lastSize);
}


/**
 * @returns The data from the dataBuffer as string.
 */
function getStringValue(): string {
	let s = '';
	for (let i = 0; i < lastSize; i++) {
		const c = dataBuffer[lastOffset + i];
		s += String.fromCharCode(c);
	}
	return s;
}
