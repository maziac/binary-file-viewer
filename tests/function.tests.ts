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
				dataBuffer = new Uint8Array([0, 254]);
				lastSize = dataBuffer.length - 1;
				assert.equal(getSignedNumberValue(), -2);
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

