

/**
 * This js script file collects functions to read the data form the file.
 */


// The data to parse.
var dataBuffer: Uint8Array;

// Index into dataBuffer.
var lastOffset: number;

// The last retrieved data size.
var lastSize: number;

// The bit index into dataBuffer.
var lastBitOffset: number;

// The last retrieved bit data size. Either lastSize is !=0 or lastBitSize. Never both.
var lastBitSize: number;

// The startOffset for relative indices (detailsParsing.)
// Is used only for displaying.
var startOffset: number;


/**
 * @returns Returns the databuffer (file) size.
 */
function getDataBufferSize(): number {
	if (!dataBuffer)
		return 0;
	return dataBuffer.length;
}


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
 * @param size The number of bytes to read. If undefined, all remaining data is read.
 */
function read(size?: number) {
	// Offsets
	lastOffset += lastSize;
	lastBitOffset += lastBitSize;
	while (lastBitOffset >= 1) {
		lastBitOffset -= 8;
		lastOffset++;
	}

	lastBitSize = 0;
	lastSize = 0;	// In case of an error later on
	if (size == undefined)
		size = dataBuffer.length - lastOffset;
	else if (lastOffset + size > dataBuffer.length)
		throw new Error("read: Reading more data than available (size=" + size + ").");
	lastSize = size;
}


/**
 * Advances the offset until the 'value' is found.
 * Most prominent use case for this is to read all data of a C-string.
 * Note: The read bytes do not contain 'value'.
 * @param value The value to search for. Searches byte-wise. Defaults to 0.
 */
function readUntil(value: number = 0) {
	lastOffset += lastSize;
	let i = lastOffset;
	const len = dataBuffer.length;
	while (true) {
		if (i >= len)
			throw new Error("readUntil: reached end of file.");
		if (dataBuffer[i] == value)
			break;
		i++;
	}
	lastSize = i - lastOffset;
}


/**
 * Advances the offset (from previous call) bitwise and
 * stores the size for reading.
 * @param size The number of bits to read.
 */
function readBits(bitSize: number) {
	// Offsets
	lastOffset += lastSize;
	lastBitOffset += lastBitSize;
	while (lastBitOffset >= 8) {
		lastBitOffset -= 8;
		lastOffset++;
	}

	// Check
	if(lastOffset + (lastBitOffset+lastBitSize)/8 > dataBuffer.length)
		throw new Error("readBits: Reading past end of file.");

	// Sizes
	lastSize = 0;
	lastBitSize = bitSize;
}


/**
 * Reads in a chunk of data. E.g. to display later in Charts.
 * @param sampleSize (Optional) The size of each data value (sample) in bytes. Defaults to 1.
 * @param offset (Optional) The starting offset in bytes. Defaults to 0.
 * @param format (Optional) 'u'=unsigned, 'i'=signed. Defaults to 'u'.
 * @param skip (Optional) The number of bytes to skip after each read sample. Defaults to 0.
 * @returns The samples in a number array.
 */
function getData(sampleSize = 1, offset = 0, format = 'i', skip = 0): number[] {
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
 * Also supports reading bits.
 * Either lastSize or lastBitSize is != 0.
 */
function getNumberValue(): number {
	let value = 0;

	// Byte wise
	if (lastSize) {
		let factor = 1;
		for (let i = 0; i < lastSize; i++) {
			value += factor * dataBuffer[lastOffset + i];
			factor *= 256;
		}
	}

	// Or bitwise
	else if (lastBitSize) {
		let mask = 0x01 << lastBitOffset;
		let factor = 1;
		let i = lastOffset;
		for (let k = 0; k < lastBitSize; k++) {
			const bit = (dataBuffer[i] & mask) ? 1 : 0;
			value += factor * bit;
			factor *= 2;
			// Next
			mask <<= 1;
			if (mask >= 0x100) {
				mask = 0x01;
				i++;
			}
		}
	}

	return value;
}

/**
 * Reads the bits from the dataBuffer.
 * Either lastSize or lastBitSize is != 0.
 * @returns E.g. '001101'
 */
function getBitsValue(): string {
	let bits = '';
	let mask = 0x01 << lastBitOffset;
	let i = lastOffset;
	const countOfBits = lastBitSize + lastSize * 8;
	for (let k = 0; k < countOfBits; k++) {
		if (k > 0 && (k % 8 == 0))
			bits = "_" + bits;
		const bit = (dataBuffer[i] & mask) ? '1' : '0';
		bits = bit + bits;
		// Next
		mask <<= 1;
		if (mask >= 0x100) {
			mask = 0x01;
			i++;
		}
	}
	return bits;
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
