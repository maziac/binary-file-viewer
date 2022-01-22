

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

// The endianness. (Default = true)
var littleEndian: boolean;


/**
 * Set the endianness for data reads.
 * @param endianness Either 'little' (default) or 'big'.
 */
function setEndianness(endianness: 'little' | 'big') {
	if (endianness == 'big')
		littleEndian = false;
	else if(endianness == 'little')
		littleEndian = true;
	else {
		// Neither big nor little
		throw new Error("Use only 'little' or 'big' for the endianness.");
	}
}


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
 * Corrects the bit offsets before reading a byte.
 */
function correctBitByteOffsets() {
	// Offsets
	lastOffset += lastSize;
	lastBitOffset += lastBitSize;
	while (lastBitOffset >= 1) {
		lastBitOffset -= 8;
		lastOffset++;
	}

	lastBitOffset = 0;
	lastBitSize = 0;
	lastSize = 0;
}


/**
 * Advances the offset (from previous call) and
 * stores the size for reading.
 * @param size The number of bytes to read. If undefined, all remaining data is read.
 */
function read(size?: number) {
	// Offsets
	correctBitByteOffsets();

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
	// Offsets
	correctBitByteOffsets();

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
function getData(sampleSize = 1, offset = 0, format = 'u', skip = 0): number[] {
	const data: number[] = [];
	const step = sampleSize + skip;
	const signed = (format == 'i');
	const max = 0x01 << (sampleSize * 8);
	const maxHalf = max / 2;
	const totalOffset = lastOffset + offset;
	const end = lastOffset + lastSize;
	for (let i = totalOffset; i < end; i += step) {
		// Read all bytes of sample
		let value = 0;
		let factor = 1;
		if (littleEndian) {
			// Little endian
			for (let k = 0; k < sampleSize; k++) {
				value += factor * dataBuffer[i + k];
				factor *= 256;
			}
		}
		else {
			// Big endian
			for (let k = sampleSize - 1; k >= 0; k--) {
				value += factor * dataBuffer[i + k];
				factor *= 256;
			}
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
 * @returns A number (not a String).
 */
function getNumberValue(): number {
	let value = 0;

	// Byte wise
	if (lastSize) {
		let factor = 1;
		if (littleEndian) {
			// Little endian
			for (let i = 0; i < lastSize; i++) {
				value += factor * dataBuffer[lastOffset + i];
				factor *= 256;
			}
		}
		else {
			// Big endian
			for (let i = lastSize - 1; i >= 0; i--) {
				value += factor * dataBuffer[lastOffset + i];
				factor *= 256;
			}
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
function getBitsValue(): String {	// NOSONAR
	let val = 0;
	let posValue = 1;
	let bits = '';
	let mask = 0x01 << lastBitOffset;
	let i = lastOffset;
	const countOfBits = lastBitSize + lastSize * 8;
	for (let k = 0; k < countOfBits; k++) {
		if (k > 0 && (k % 8 == 0))
			bits = "_" + bits;
		const bit = (dataBuffer[i] & mask) ? '1' : '0';
		bits = bit + bits;
		// Also calculate value for hex (hover) conversion
		if (bit == '1')
			val += posValue;
		posValue *= 2;
		// Next
		mask <<= 1;
		if (mask >= 0x100) {
			mask = 0x01;
			i++;
		}
	}
	// Add hover property
	const sc = new String(bits);	// NOSONAR
	(sc as any).hoverValue = 'Hex: 0x' + convertToHexString(val, 4);
	return sc;
}


/**
 * @returns The value from the dataBuffer as decimal string.
 */
function getDecimalValue(): String {	// NOSONAR
	const val = getNumberValue();
	const s = val.toString();
	// Add hover property
	const sc = new String(s);	// NOSONAR
	(sc as any).hoverValue = 'Hex: 0x' + convertToHexString(val, 4);
	return sc;

}


/**
 * @returns The value from the dataBuffer as hex string.
 */
function getHexValue(): String {	// NOSONAR
	const val = getNumberValue();
	let s = val.toString(16).toUpperCase();
	s = s.padStart(lastSize * 2, '0');
	// Add hover property
	const sc = new String(s);	// NOSONAR
	(sc as any).hoverValue = 'Dec: ' + val;
	return sc;
}


/**
 * @returns The value from the dataBuffer as hex string + "0x" in front.
 */
function getHex0xValue(): String {	// NOSONAR
	const hsc = getHexValue();
	// Copy hover property
	const sc = new String('0x' + hsc);	// NOSONAR
	(sc as any).hoverValue = (hsc as any).hoverValue;
	return sc;
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
