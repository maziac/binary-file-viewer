/**
 * This js script file collects functions to read the data from the file.
 */


// The data to parse.
export let dataBuffer: Uint8Array;
export function setDataBuffer(val: Uint8Array) {
	dataBuffer = val;
}

// Index into dataBuffer.
export let lastOffset: number;
export function setLastOffset(val: number) {
	lastOffset = val;
}

// The last retrieved data size.
export let lastSize: number;
export function setLastSize(val: number) {
	lastSize = val;
}

// The bit index into dataBuffer.
export let lastBitOffset: number;
export function setLastBitOffset(val: number) {
	lastBitOffset = val;
}

// The last retrieved bit data size. Either lastSize is !=0 or lastBitSize. Never both.
export let lastBitSize: number;
export function setLastBitSize(val: number) {
	lastBitSize = val;
}

// The startOffset for relative indices (detailsParsing.)
// Is used only for displaying.
export let startOffset: number;
export function setStartOffset(val: number) {
	startOffset = val;
}

// The endianness. (Default = true)
export let littleEndian: boolean;
export function setLittleEndian(val: boolean) {
	littleEndian = val;
}


/**
 * Set the endianness for data reads.
 * @param endianness Either 'little' (default) or 'big'.
 */
export function setEndianness(endianness: 'little' | 'big') {
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
export function getDataBufferSize(): number {
	if (!dataBuffer)
		return 0;
	return dataBuffer.length;
}


/**
 * Returns the relative index used for displaying inside collapsed sections.
 */
export function getRelOffset(): number {
	return lastOffset - startOffset;
}


/**
 * Convert array to base 64 string.
 */
export function arrayBufferToBase64(buffer: any) {
	let binary = '';
	const bytes = [].slice.call(new Uint8Array(buffer));
	bytes.forEach((b: any) => binary += String.fromCharCode(b));
	return window.btoa(binary);
}


/**
 * @returns true if end of file reached.
 */
export function endOfFile(): boolean {
	return (lastOffset + lastSize >= dataBuffer.length);
}



/**
 * Advances the offset (from previous call) bitwise and
 * stores the size for reading.
 * @param size The number of bits to read.
 */
export function readBits(bitSize: number) {
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
export function getData(sampleSize = 1, offset = 0, format = 'u', skip = 0): number[] {
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
export function convertToHexString(value: number, size: number): string {
	if (value == undefined)
		return "".padStart(size, '?');
	const s = value.toString(16).toUpperCase().padStart(size, '0');
	return s;
}


/**
 * Corrects the bit offsets before reading a byte.
 */
export function correctBitByteOffsets() {
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
 * Advances the offset until the 'value' is found.
 * Most prominent use case for this is to read all data of a C-string.
 * Note: The read bytes do not contain 'value'.
 * @param value The value to search for. Searches byte-wise. Defaults to 0.
 */
export function readUntil(value: number = 0) {
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
 * Advances the offset (from previous call) and
 * stores the size for reading.
 * @param size The number of bytes to read. If undefined, all remaining data is read.
 * size might be negative. In that case the lastOffset is decreased.
 */
export function read(size?: number) {
	// Offsets
	correctBitByteOffsets();

	if (size == undefined)
		size = dataBuffer.length - lastOffset;
	else if (typeof size !== 'number')
		throw new Error("read: 'size' is " + typeof size + ", it should be a number");
	else if (isNaN(size))
		throw new Error("read: 'size' is not a number (NaN).");
	else if (lastOffset + size > dataBuffer.length)
		throw new Error("read: Reading more data than available (size=" + size + " at offset=" + lastOffset + ").");
	else if (lastOffset + size < 0)
		throw new Error("read: Would move offset before file start (size=" + size + " at offset=" + lastOffset + ").");

	// Check for negative size (move offset backwards)
	if (size < 0) {
		size = -size;
		lastOffset -= size;
	}

	lastSize = size;
}


/**
 * Sets the absolute offset in the file.
 * @param offset The offset inside the file.
 */
export function setOffset(offset: number) {
	// Offsets
	lastBitOffset = 0;
	lastBitSize = 0;
	lastSize = 0;

	if (offset == undefined)
		throw new Error("setOffset: you need to set the 'offset' as parameter.");
	else if (typeof offset != 'number')
		throw new Error("setOffset: 'offset' is not a number");
	else if (offset > dataBuffer.length)
		throw new Error("setOffset: Trying to set offset after to a value bigger than the file length (offset=" + offset + ", file length=" + dataBuffer.length + ").");
	else if (offset < 0)
		throw new Error("setOffset: Would move offset before file start (offset=" + offset + ").");

	lastOffset = offset;
}


/**
 * Returns the current lastOffset.
 * Used to restore an offset if changed e.g. by setOffset().
 * @returns 'lastOffset'
 */
export function getOffset(): number {
	return lastOffset;
}


/**
 * Reads the value from the buffer.
 * Also supports reading bits.
 * Either lastSize or lastBitSize is != 0.
 * @returns A number (not a String).
 */
export function getNumberValue(): number {
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
export function getSignedNumberValue(): number {

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

	// Error
	throw new Error("getSignedNumberValue: No lastSize ot lastBitSize found (please report an error).");
}


/**
 * Reads a value from the buffer as float (IEEE754) value.
 * Supported are only single (32bit) and double (64bit) values.
 * The size is determined by the read size.
 * Either lastSize or lastBitSize is != 0.
 * @returns A number (not a String).
 */
export function getFloatNumberValue(): number {
	let value = 0;
	let floatSize: number;
	let fracSize: number;
	let expSize: number;
	let floatData: Uint8Array;

	// Byte wise
	if (lastSize) {
		// Check size
		if (lastSize !== 4 && lastSize !== 8) {
			throw new Error("Only 4 or 8 byte floating point values are supported.");
		}
		// Byte wise
		floatSize = lastSize;
	}

	// Check bit size
	else {
		if (lastBitSize !== 32 && lastBitSize !== 64) {
			throw new Error("Only 32 or 64 bit floating point values are supported.");
		}
		if (lastBitOffset !== 0) {
			throw new Error("Decoding of floating point values is only supported for a bit offset of 0.");
		}
		// Bit wise
		floatSize = lastBitSize / 8;
	}

	// Copy data (assume big endian for now)
	floatData = new Uint8Array(floatSize);
	for (let i = 0; i < floatSize; i++) {
		floatData[i] = dataBuffer[lastOffset + i];
	}

	// Endianness
	if (littleEndian) {
		// Little endian
		const len2 = floatSize / 2;
		// Swap data
		for (let i = 0; i < len2; i++) {
			const j = floatSize - 1 - i;
			const val = floatData[j];
			floatData[j] = floatData[i];
			floatData[i] = val;
		}
	}

	// Check size
	if (floatSize == 4) {
		// single
		fracSize = 23;
		expSize = 8;
	}
	else {
		// double
		fracSize = 52;
		expSize = 11;
	}

	// floatData is big endian at this point
	let i = 0;
	let data = floatData[i++];
	let sign = (data >= 0x80) ? -1 : 1;
	let exp = data & 0x7F;
	let expSize2 = expSize - 7;	// 1 or 4
	exp <<= expSize2;
	data = floatData[i++];
	let exp2 = data >> (8 - expSize2);
	exp += exp2;
	if (exp != 0) {	// exp == 0 => return 0.0
		// Calculate fraction
		let frac = data & (0xFF >> expSize2);
		let fracSize2 = fracSize;
		while (fracSize2 >= 8) {
			frac *= 256;
			frac += floatData[i++];
			fracSize2 -= 8;
		}

		// Infinite, NaN?
		if ((expSize == 8 && exp == 0xFF)
			|| (expSize == 11 && exp == 0x7FF)) {
			if (frac == 0) {
				// Infinite
				value = (sign > 0) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
			}
			else {
				value = Number.NaN;
			}
		}

		// Normal
		else {
			const expM = (1 << (expSize - 1)) - 1;
			const expN = exp - expM;
			const mBit = (fracSize == 23) ? 0x800000 : 4503599627370496;
			const mantissa = frac + mBit;
			value = sign * (mantissa / mBit) * Math.pow(2, expN);
		}
	}

	return value;
}


/**
 * Reads the bits from the dataBuffer.
 * Either lastSize or lastBitSize is != 0.
 * @returns E.g. '001101'
 */
export function getBitsValue(): String {	// NOSONAR
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
 * Is exported for testing purposes.
 */
export function _getDecimalValue(): string {	// NOSONAR
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
 * Is exported for testing purposes.
 */
export function _getSignedDecimalValue(): string {
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
export function getDecimalValue(): String {	// NOSONAR
	const value = _getDecimalValue();
	// Add hover property
	const sc = new String(value);	// NOSONAR
	(sc as any).hoverValue = 'Hex: ' + getHex0xValue();
	return sc;
}


/**
 * @returns The value from the dataBuffer as positive decimal string.
 */
export function getSignedDecimalValue(): String {	// NOSONAR
	const value = _getSignedDecimalValue();
	// Add hover property
	const sc = new String(value);	// NOSONAR
	(sc as any).hoverValue = 'Hex: ' + getHex0xValue();
	return sc;
}


/**
 * This function is internally used.
 * @returns The value from the dataBuffer as hex string primitive.
 * Is exported for testing purposes.
 */
export function _getHexValue(): string {	// NOSONAR
	// Read value directly to overcome rounding issues
	let s = '';
	// Byte wise
	if (lastSize) {
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
export function getHexValue(): String {	// NOSONAR
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
export function getHex0xValue(): String {	// NOSONAR
	const s = _getHexValue();
	// Copy hover property
	const sc = new String('0x' + s);	// NOSONAR
	(sc as any).hoverValue = 'Dec: ' + _getDecimalValue();
	return sc;
}


/**
 * @returns The data from the dataBuffer as string.
 */
export function getStringValue(): string {
	let s = '';
	for (let i = 0; i < lastSize; i++) {
		const c = dataBuffer[lastOffset + i];
		s += String.fromCharCode(c);
	}
	return s;
}
