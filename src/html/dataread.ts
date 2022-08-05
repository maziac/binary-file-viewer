

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
 * @returns true if end of file reached.
 */
function endOfFile(): boolean {
	return (lastOffset + lastSize >= dataBuffer.length);
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
	else if (typeof size != 'number')
		throw new Error("read: 'size' is not a number");
	else if (lastOffset + size > dataBuffer.length)
		throw new Error("read: Reading more data than available (size=" + size + " at offset=" + lastOffset + ").");
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


/*
--------------------------------------
Copy from here to end for unit tests:
*/



const BigInt256 = BigInt(256);


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
 * Reads the value from the buffer.
 * Also supports reading bits.
 * Either lastSize or lastBitSize is != 0.
 * @returns A number (not a String), if highest bit is set it is a negative number.
 * E.g. if lastSize is 1 and the data is 0x81 it returns -127.
 */
function getSignedNumberValue(): number {

	// Byte wise
	if (lastSize) {
		// Check last bit
		const maxByteOffset = (littleEndian) ? lastSize - 1 : 0;
		const lastByte = dataBuffer[lastOffset + maxByteOffset];
		if (lastByte <= 127) {
			// Is a positive number
			return getNumberValue();
		}

		// Is a negative number
		let value = 0;
		let factor = 1;
		if (littleEndian) {
			// Little endian
			for (let i = 0; i < lastSize; i++) {
				value -= factor * (255 - dataBuffer[lastOffset + i]);
				factor *= 256;
			}
		}
		else {
			// Big endian
			for (let i = lastSize - 1; i >= 0; i--) {
				value -= factor * (255 - dataBuffer[lastOffset + i]);
				factor *= 256;
			}
		}
		value--;
		return value;
	}

	// Or bitwise
	else if (lastBitSize) {
		// Is a negative number
		let mask = 0x01 << lastBitOffset;
		let factor = 1;
		let i = lastOffset;
		let value = 0;
		let valueNeg = -1;
		let bit;
		for (let k = 0; k < lastBitSize; k++) {
			const data = dataBuffer[i];
			// Calculates negative and positive number in parallel
			const bitNegative = ((255 - data) & mask) ? 1 : 0;
			valueNeg -= factor * bitNegative;
			bit = (data & mask) ? 1 : 0;
			value += factor * bit;
			factor *= 2;
			// Next
			mask <<= 1;
			if (mask >= 0x100) {
				mask = 0x01;
				i++;
			}
		}
		// Check if neg or pos
		if (bit) {
			// Negative
			return valueNeg;
		}
		// Positive
		return value;
	}
}


/**
 * Reads the bits from the dataBuffer.
 * Either lastSize or lastBitSize is != 0.
 * @returns E.g. '001101'
 */
function getBitsValue(): String {	// NOSONAR
	let value = 0;
	let posValue = 1;
	let bits = '';
	let mask = 0x01 << lastBitOffset;
	let i = lastOffset;
	const countOfBits = lastBitSize + lastSize * 8;
	let s = '';
	for (let k = 0; k < countOfBits; k++) {
		if (k > 0 && (k % 8 == 0))
			bits = "_" + bits;
		const bit = (dataBuffer[i] & mask) ? '1' : '0';
		bits = bit + bits;
		// Also calculate value for hex (hover) conversion
		if (bit == '1')
			value += posValue;
		posValue *= 2;
		if (posValue >= 256) {
			// Store hex byte
			s = value.toString(16).toUpperCase().padStart(2, '0') + s;
			// Next
			posValue = 1;
			value = 0;
		}
		// Next
		mask <<= 1;
		if (mask >= 0x100) {
			mask = 0x01;
			i++;
		}
	}

	// Add last hex byte
	if (posValue != 1) {
		s = value.toString(16).toUpperCase() + s;
	}

	// Add hover property
	const sc = new String(bits);	// NOSONAR
	(sc as any).hoverValue = 'Hex: 0x' + s;
	return sc;
}


/**
 * This function is internally used.
 * @returns The value from the dataBuffer as dec string primitive.
 * The returned value is accurate. I.e. it uses BigInt internally.
 */
function _getDecimalValue(): string {	// NOSONAR
	// Read value directly to overcome rounding issues
	let bValue: bigint = BigInt(0);

	// Byte wise
	if (lastSize) {
		if (littleEndian) {
			// Little endian
			for (let i = lastSize - 1; i >= 0; i--) {
				bValue *= BigInt256;
				bValue += BigInt(dataBuffer[lastOffset + i]);
			}
		}
		else {
			// Big endian
			for (let i = 0; i < lastSize; i++) {
				bValue *= BigInt256;
				bValue += BigInt(dataBuffer[lastOffset + i]);
			}
		}
	}

	// Or bitwise
	else if (lastBitSize) {
		let mask = 0x01 << lastBitOffset;
		let factor = 1;
		let bigFactor: bigint = BigInt(1);
		let i = lastOffset;
		let value = 0;
		for (let k = 0; k < lastBitSize; k++) {
			const bit = (dataBuffer[i] & mask) ? 1 : 0;
			value += factor * bit;
			factor *= 2;
			if (factor >= 256) {
				// Add byte
				bValue += bigFactor * BigInt(value);
				// Next
				factor = 1;
				value = 0;
				bigFactor *= BigInt256;
			}
			// Next
			mask <<= 1;
			if (mask >= 0x100) {
				// Next
				mask = 0x01;
				i++;
			}
		}

		// Add last byte
		if (factor != 1) {
			bValue += bigFactor * BigInt(value);
		}
	}

	const s = bValue.toString();
	return s;
}


/**
 * This function is internally used.
 * @returns The value from the dataBuffer as dec string primitive.
 * The returned value is accurate. I.e. it uses BigInt internally.
 */
function _getSignedDecimalValue(): string {
	// Check last bit
	const maxByteOffset = (littleEndian) ? lastSize - 1 : 0;
	const lastByte = dataBuffer[lastOffset + maxByteOffset];
	if (lastByte <= 127) {
		// Is a positive number
		return _getDecimalValue();
	}
	// The value is negative.

	// Read value directly to overcome rounding issues
	let bValue: bigint = BigInt(0);

	// Byte wise
	if (lastSize) {
		let bFactor: bigint = BigInt(1);
		if (littleEndian) {
			// Little endian
			for (let i = 0; i < lastSize; i++) {
				const data = 255 - dataBuffer[lastOffset + i];
				bValue -= bFactor * BigInt(data);
				bFactor *= BigInt256;
			}
		}
		else {
			// Big endian
			for (let i = lastSize - 1; i >= 0; i--) {
				const data = 255 - dataBuffer[lastOffset + i];
				bValue -= bFactor * BigInt(data);
				bFactor *= BigInt256;
			}
		}
		bValue -= BigInt(1);
	}

	// Or bitwise
	else if (lastBitSize) {
		let mask = 0x01 << lastBitOffset;
		let factor = 1;
		let bigFactor: bigint = BigInt(1);
		let i = lastOffset;
		let value = -1;
		for (let k = 0; k < lastBitSize; k++) {
			const data = dataBuffer[i];
			const bit = ((255 - data) & mask) ? 1 : 0;
			value += factor * bit;
			factor *= 2;
			if (factor >= 256) {
				// Add byte
				bValue -= bigFactor * BigInt(value);
				// Next
				factor = 1;
				value = 0;
				bigFactor *= BigInt256;
			}
			// Next
			mask <<= 1;
			if (mask >= 0x100) {
				// Next
				mask = 0x01;
				i++;
			}
		}

		// Add last byte
		if (factor != 1) {
			bValue += bigFactor * BigInt(value);
		}
	}

	const s = bValue.toString();
	return s;
}


/**
 * @returns The value from the dataBuffer as positive decimal string.
 */
function getDecimalValue(): String {	// NOSONAR
	const value = _getDecimalValue();
	// Add hover property
	const sc = new String(value);	// NOSONAR
	(sc as any).hoverValue = 'Hex: ' + getHex0xValue();
	return sc;
}


/**
 * @returns The value from the dataBuffer as positive decimal string.
 */
function getSignedDecimalValue(): String {	// NOSONAR
	const value = _getSignedDecimalValue();
	// Add hover property
	const sc = new String(value);	// NOSONAR
	(sc as any).hoverValue = 'Hex: ' + getHex0xValue();
	return sc;
}


/**
 * This function is internally used.
 * @returns The value from the dataBuffer as hex string primitive.
 */
function _getHexValue(): string {	// NOSONAR
	// Read value directly to overcome rounding issues
	let s = '';
	// Byte wise
	if (lastSize) {
		let factor = 1;
		if (littleEndian) {
			// Little endian
			for (let i = lastSize - 1; i >= 0; i--) {
				s += dataBuffer[lastOffset + i].toString(16).toUpperCase().padStart(2, '0');
			}
		}
		else {
			// Big endian
			for (let i = 0; i < lastSize; i++) {
				s += dataBuffer[lastOffset + i].toString(16).toUpperCase().padStart(2, '0');
			}
		}
	}

	// Or bitwise
	else if (lastBitSize) {
		let mask = 0x01 << lastBitOffset;
		let factor = 1;
		let i = lastOffset;
		let value = 0;
		for (let k = 0; k < lastBitSize; k++) {
			const bit = (dataBuffer[i] & mask) ? 1 : 0;
			value += factor * bit;
			factor *= 2;
			if (factor >= 256) {
				// Store byte
				s = value.toString(16).toUpperCase().padStart(2, '0') + s;
				// Next
				factor = 1;
				value = 0;
			}
			// Next
			mask <<= 1;
			if (mask >= 0x100) {
				// Next
				mask = 0x01;
				i++;
			}
		}

		// Add last hex byte
		if (factor != 1) {
			s = value.toString(16).toUpperCase() + s;
		}
	}

	return s;
}


/**
 * @returns The value from the dataBuffer as hex string.
 */
function getHexValue(): String {	// NOSONAR
	// Read value directly to overcome rounding issues
	const s = _getHexValue();
	// Add hover property
	const sc = new String(s);	// NOSONAR
	(sc as any).hoverValue = 'Dec: ' + _getDecimalValue();
	return sc;
}


/**
 * @returns The value from the dataBuffer as hex string + "0x" in front.
 */
function getHex0xValue(): String {	// NOSONAR
	const s = _getHexValue();
	// Copy hover property
	const sc = new String('0x' + s);	// NOSONAR
	(sc as any).hoverValue = 'Dec: ' + _getDecimalValue();
	return sc;
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
