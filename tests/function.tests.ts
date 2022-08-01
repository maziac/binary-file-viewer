import * as assert from 'assert';

/**
 * This tests the functions defined in the webview.
 * Simply copy the functions here to test.
 * E.g. copy function 'getNumberValue(...)' here.
 */


let dataBuffer: Uint8Array;
let lastOffset: number;
let lastSize: number;
let lastBitOffset: number;
let lastBitSize: number;
let littleEndian: boolean;


suite('Functions', () => {

	// Called for each test.
	setup(() => {
		lastOffset = 1;
		lastSize = 0;
		lastBitOffset = 0;
		lastBitSize = 0;
		littleEndian = true;
	});


	suite('convertToHexString()', () => {
		test('undefined', () => {
			assert.equal(convertToHexString(undefined as number, 5), '?????');
		});
		test('misc', () => {
			assert.equal(convertToHexString(1, 3), '001');
			assert.equal(convertToHexString(0xFE013A, 6), 'FE013A');
			assert.equal(convertToHexString(0xABCDEFFE013A, 6), 'ABCDEFFE013A');
			assert.equal(convertToHexString(0xF0E0ABCDEFFE013A, 6), 'F0E0ABCDEFFE0000');  // Is inaccurate
		});
		test('unspecified, negative nubmers', () => {
			assert.equal(convertToHexString(-1, 3), '0-1');
		});
	});


	suite('getNumberValue()', () => {

		suite('litte endian', () => {
			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 254]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 254);
			});

			test('2 byte', () => {
				dataBuffer = new Uint8Array([0, 0x05, 0x82]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 0x8205);
			});

			test('4 byte', () => {
				dataBuffer = new Uint8Array([0, 0x05, 0x82, 0xAB, 0x7F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 0x7FAB8205);
			});

			test('8 byte', () => {
				dataBuffer = new Uint8Array([0, 0x04, 0x82, 0xAB, 0x7F, 0x01, 0x02, 0x03, 0x8A]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 9944794607624356000);
			});

			test('8 byte, same value, inaccurate', () => {
				dataBuffer = new Uint8Array([0, 0x05 /*IS DIFFERENT*/, 0x82, 0xAB, 0x7F, 0x01, 0x02, 0x03, 0x8A]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 9944794607624356000);
			});
		});


		suite('big endian', () => {
			setup(() => {
				littleEndian = false;
			});

			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 254]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 254);
			});

			test('2 byte', () => {
				dataBuffer = new Uint8Array([0, 0x82, 0x05 ]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 0x8205);
			});

			test('4 byte', () => {
				dataBuffer = new Uint8Array([0, 0x7F, 0xAB, 0x82, 0x05]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 0x7FAB8205);
			});

			test('8 byte', () => {
				dataBuffer = new Uint8Array([0, 0x8A, 0x03, 0x02, 0x01, 0x7F, 0xAB, 0x82, 0x04]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 9944794607624356000);
			});

			test('8 byte, same value, inaccurate', () => {
				dataBuffer = new Uint8Array([0, 0x8A, 0x03, 0x02, 0x01, 0x7F, 0xAB, 0x82, 0x05 /*IS DIFFERENT*/]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getNumberValue(), 9944794607624356000);
			});
		});

		suite('bits', () => {
			setup(() => {
				// Endianness does not matter.
				lastBitOffset = 1;
				lastSize = 0;
			});

			test('In 1 byte', () => {
				dataBuffer = new Uint8Array([0, 0b11110110]);
				lastBitSize = 5;
				assert.equal(getNumberValue().toString(2), '11011');
			});

			test('Through 2 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b11111111]);
				lastBitSize = 9;
				assert.equal(getNumberValue().toString(2), '111111011');
			});

			test('Through 3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b10010010, 0b11111111]);
				lastBitSize = 18;
				assert.equal(getNumberValue().toString(2), '111100100101111011');
			});
		});
	});


	suite('getSignedNumberValue()', () => {

		suite('little endian', () => {

			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 254]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -2);
			});

			test('2 byte', () => {
				dataBuffer = new Uint8Array([0, 0x05, 0x82]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -32251);
			});

			test('4 byte', () => {
				dataBuffer = new Uint8Array([0, 0x05, 0x82, 0xAB, 0x7F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), 0x7FAB8205);
			});

			test('8 byte', () => {
				dataBuffer = new Uint8Array([0, 0x04, 0x82, 0xAB, 0x7F, 0x01, 0x02, 0x03, 0x8A]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -8501949466085195000);
			});

			test('8 byte, same value, inaccurate', () => {
				dataBuffer = new Uint8Array([0, 0x05 /*IS DIFFERENT*/, 0x82, 0xAB, 0x7F, 0x01, 0x02, 0x03, 0x8A]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -8501949466085195000);
			});
		});


		suite('big endian', () => {
			setup(() => {
				littleEndian = false;
			});

			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 253]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -3);
			});

			test('2 byte', () => {
				dataBuffer = new Uint8Array([0, 0x82, 0x05]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -32251);
			});

			test('4 byte', () => {
				dataBuffer = new Uint8Array([0, 0x7F, 0xAB, 0x82, 0x05]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), 0x7FAB8205);
			});

			test('8 byte', () => {
				dataBuffer = new Uint8Array([0, 0x8A, 0x03, 0x02, 0x01, 0x7F, 0xAB, 0x82, 0x04]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -8501949466085195000);
			});

			test('8 byte, same value, inaccurate', () => {
				dataBuffer = new Uint8Array([0, 0x8A, 0x03, 0x02, 0x01, 0x7F, 0xAB, 0x82, 0x05 /*IS DIFFERENT*/]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -8501949466085195000);
			});
		});

		suite('bits', () => {
			setup(() => {
				// Endianness does not matter.
				lastBitOffset = 1;
				lastSize = 0;
			});

			test('In 1 byte', () => {
				lastBitSize = 5;

				// negative
				dataBuffer = new Uint8Array([0, 0b11110110]);
				assert.equal(getSignedNumberValue(), -5);

				// positive
				dataBuffer = new Uint8Array([0, 0b11010110]);
				assert.equal(getSignedNumberValue(), 11);
			});

			test('Through 2 bytes', () => {
				lastBitSize = 9;

				// negative
				dataBuffer = new Uint8Array([0, 0b10110110, 0b11111111]);
				assert.equal(getSignedNumberValue(), -37); // 1 11011011

				// positive
				dataBuffer = new Uint8Array([0, 0b10110110, 0b11111101]);
				assert.equal(getSignedNumberValue(), 219); // 0 11011011
			});

			test('Through 3 bytes', () => {
				lastBitSize = 18;

				// negative
				dataBuffer = new Uint8Array([0, 0b10110110, 0b10010010, 0b11111110]);
				assert.equal(getSignedNumberValue(), 0b110100100101011011 - 0b1000000000000000000); // 11 01001001 01011011

				// positive
				dataBuffer = new Uint8Array([0, 0b10110110, 0b10010010, 0b11111010]);
				assert.equal(getSignedNumberValue(), 0b010100100101011011); // 01 01001001 01011011

			});
		});
	});
});



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
		let valueNeg = 0;
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
			valueNeg--;
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
	const size = Math.ceil(countOfBits / 4);
	(sc as any).hoverValue = 'Hex: 0x' + convertToHexString(val, size);
	return sc;
}


/**
 * @returns The value from the dataBuffer as positive decimal string.
 */
function getDecimalValue(): String {	// NOSONAR
	const value = getNumberValue();
	// Add hover property
	const sc = new String(value);	// NOSONAR
	(sc as any).hoverValue = 'Hex: ' + getHex0xValue();
	return sc;
}


/**
 * @returns The value from the dataBuffer as positive decimal string.
 */
function getSignedDecimalValue(): String {	// NOSONAR
	const value = getSignedNumberValue();
	// Add hover property
	const sc = new String(value);	// NOSONAR
	(sc as any).hoverValue = 'Hex: ' + getHex0xValue();
	return sc;
}


/**
 * @returns The value from the dataBuffer as hex string.
 */
function getHexValue(): String {	// NOSONAR
	// Read value directly to overcome rounding issues
	// TODO: Also bits
	let val = 0;
	let s = val.toString(16).toUpperCase();
	s = s.padStart(lastSize * 2, '0');
	// Add hover property
	const sc = new String(s);	// NOSONAR
	const decVal = getNumberValue();
	(sc as any).hoverValue = 'Dec: ' + decVal;
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
	s = s.substring(0, s.length - 1);
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
