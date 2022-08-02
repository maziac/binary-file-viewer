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

	suite('getBitsValue()', () => {
		setup(() => {
			lastOffset = 1;
			lastSize = 0;
			lastBitOffset = 0;
			lastBitSize = 0;
			littleEndian = true;
		});

		test('lastSize = 2', () => {
			dataBuffer = new Uint8Array([0, 0x0F, 0x12]);
			lastSize = dataBuffer.length - 1;
			const s: any = getBitsValue();
			assert.equal(s.toString(), '00010010_00001111');
			assert.equal(s.hoverValue, 'Hex: 0x120F');
		});

		test('lastBitSize = 19', () => {
			dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0xFB]);
			lastSize = 0;
			lastBitSize = 19;
			lastBitOffset = 4;
			const s: any = getBitsValue();
			assert.equal(s.toString(), '111_10110001_00100000');
			assert.equal(s.hoverValue, 'Hex: 0x7B120');
		});
	});

	suite('_getDecimalValue()', () => {
		setup(() => {
			lastOffset = 1;
			lastSize = 0;
			lastBitOffset = 0;
			lastBitSize = 0;
			littleEndian = true;
		});

		suite('little endian', () => {
			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '15');

				dataBuffer = new Uint8Array([0, 0x9F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '159');
			});

			test('3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '8065551');
			});

			test('10 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '597028895935846336369167');
			});
		});

		suite('big endian', () => {
			setup(() => {
				littleEndian = false;
			});

			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '15');

				dataBuffer = new Uint8Array([0, 0x9F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '159');
			});

			test('3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x7B, 0x12, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '8065551');
			});

			test('10 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x7E, 0x6D, 0x00, 0x55, 0x3A, 0xFe, 0x40, 0x7B, 0x12, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getDecimalValue(), '597028895935846336369167');
			});
		});

		suite('bits', () => {
			setup(() => {
				// Endianness does not matter.
				lastBitOffset = 2;
				lastSize = 0;
			});

			test('In 1 byte', () => {
				dataBuffer = new Uint8Array([0, 0b11110110]);
				lastBitSize = 5;
				assert.equal(_getDecimalValue(), '29');	// '11101'
			});

			test('Through 2 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b11111110]);
				lastBitSize = 9;
				assert.equal(_getDecimalValue(), '445'); // '110111101'
			});

			test('Through 3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b10010010, 0b11111111]);
				lastBitSize = 18;
				assert.equal(_getDecimalValue(), '255165'); // '11'1110 0100'1011 1101'
			});

			test('8 bit', () => {
				dataBuffer = new Uint8Array([0, 0b00110110, 0b00]);
				lastBitSize = 8;
				assert.equal(_getDecimalValue(), '13'); // '0000 1101'
			});
		});
	});

	suite('_getSignedDecimalValue()', () => {
		setup(() => {
			lastOffset = 1;
			lastSize = 0;
			lastBitOffset = 0;
			lastBitSize = 0;
			littleEndian = true;
		});

		suite('little endian', () => {
			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '15');

				dataBuffer = new Uint8Array([0, 0x9F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '-97');
			});

			test('3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '8065551');

				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x8B]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '-7663089');
			});

			test('10 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '597028895935846336369167');

				dataBuffer = new Uint8Array([0, 0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '-3');
			});
		});

		suite('big endian', () => {
			setup(() => {
				littleEndian = false;
			});

			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '15');

				dataBuffer = new Uint8Array([0, 0x9F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '-97');
			});

			test('3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x7B, 0x12, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '8065551');

				dataBuffer = new Uint8Array([0, 0x8B, 0x12, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '-7663089');
			});

			test('10 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x7E, 0x6D, 0x00, 0x55, 0x3A, 0xFE, 0x40, 0x7B, 0x12, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '597028895935846336369167');

				dataBuffer = new Uint8Array([0, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFD]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getSignedDecimalValue(), '-3');
			});
		});

		suite('bits', () => {
			setup(() => {
				// Endianness does not matter.
				lastBitOffset = 2;
				lastSize = 0;
			});

			test('In 1 byte', () => {
				dataBuffer = new Uint8Array([0, 0b11110110]);
				lastBitSize = 5;
				assert.equal(_getDecimalValue(), '29');	// '11101'
			});

			test('Through 2 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b11111110]);
				lastBitSize = 9;
				assert.equal(_getDecimalValue(), '445'); // '110111101'
			});

			test('Through 3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b10010010, 0b11111111]);
				lastBitSize = 18;
				assert.equal(_getDecimalValue(), '255165'); // '11'1110 0100'1011 1101'
			});

			test('8 bit', () => {
				dataBuffer = new Uint8Array([0, 0b00110110, 0b00]);
				lastBitSize = 8;
				assert.equal(_getDecimalValue(), '13'); // '0000 1101'
			});
		});
	});

	suite('getDecimalValue()', () => {
		test('value + hover', () => {
			dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
			lastSize = dataBuffer.length - 1;
			const s: any = getDecimalValue();
			assert.equal(s.toString(), '597028895935846336369167');
			assert.equal(s.hoverValue, 'Hex: 0x7E6D00553AFE407B120F');
		});
	});

	suite('getSignedDecimalValue()', () => {
		test('value + hover', () => {
			dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
			lastSize = dataBuffer.length - 1;
			let s: any = getSignedDecimalValue();
			assert.equal(s.toString(), '597028895935846336369167');
			assert.equal(s.hoverValue, 'Hex: 0x7E6D00553AFE407B120F');

			dataBuffer = new Uint8Array([0, 0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
			lastSize = dataBuffer.length - 1;
			s = getSignedDecimalValue();
			assert.equal(s.toString(), '-3');
			assert.equal(s.hoverValue, 'Hex: 0xFFFFFFFFFFFFFFFD');
		});
	});

	suite('_getHexValue()', () => {
		setup(() => {
			lastOffset = 1;
			lastSize = 0;
			lastBitOffset = 0;
			lastBitSize = 0;
			littleEndian = true;
		});

		suite('little endian', () => {
			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '0F');

				dataBuffer = new Uint8Array([0, 0x9F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '9F');
			});

			test('3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '7B120F');
			});

			test('10 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '7E6D00553AFE407B120F');
			});
		});

		suite('big endian', () => {
			setup(() => {
				littleEndian = false;
			});

			test('1 byte', () => {
				dataBuffer = new Uint8Array([0, 0x0F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '0F');

				dataBuffer = new Uint8Array([0, 0x9F]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '9F');
			});

			test('3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '0F127B');
			});

			test('10 bytes', () => {
				dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
				lastSize = dataBuffer.length - 1;
				assert.equal(_getHexValue(), '0F127B40FE3A55006D7E');
			});
		});

		suite('bits', () => {
			setup(() => {
				// Endianness does not matter.
				lastBitOffset = 2;
				lastSize = 0;
			});

			test('In 1 byte', () => {
				dataBuffer = new Uint8Array([0, 0b11110110]);
				lastBitSize = 5;
				assert.equal(_getHexValue(), '1D');	// '11101'
			});

			test('Through 2 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b11111110]);
				lastBitSize = 9;
				assert.equal(_getHexValue(), '1BD'); // '110111101'
			});

			test('Through 3 bytes', () => {
				dataBuffer = new Uint8Array([0, 0b11110110, 0b10010010, 0b11111111]);
				lastBitSize = 18;
				assert.equal(_getHexValue(), '3E4BD'); // '11'1110 0100'1011 1101'
			});

			test('8 bit', () => {
				dataBuffer = new Uint8Array([0, 0b00110110, 0b00]);
				lastBitSize = 8;
				assert.equal(_getHexValue(), '0D'); // '0000 1101'
			});
		});
	});

	suite('getHexValue()', () => {
		test('value + hover', () => {
			dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
			lastSize = dataBuffer.length - 1;
			const s: String = getHexValue();	// NOSONAR
			assert.equal(s.toString(), '7E6D00553AFE407B120F');
			assert.equal((s as any).hoverValue, 'Dec: 597028895935846336369167');
		});
	});

	suite('getHex0xValue()', () => {
		test('value + hover', () => {
			dataBuffer = new Uint8Array([0, 0x0F, 0x12, 0x7B, 0x40, 0xFE, 0x3A, 0x55, 0x00, 0x6D, 0x7E]);
			lastSize = dataBuffer.length - 1;
			const s: String = getHex0xValue();	// NOSONAR
			assert.equal(s.toString(), '0x7E6D00553AFE407B120F');
			assert.equal((s as any).hoverValue, 'Dec: 597028895935846336369167');
		});
	});

	suite('convertBitsToString()', () => {
		test('?', () => {
			assert.equal(false, true);
		});
	});

	suite('getStringValue()', () => {
		setup(() => {
			lastOffset = 1;
		});

		test('1 char', () => {
			dataBuffer = new TextEncoder().encode("_A");
			lastSize = dataBuffer.length - 1;
			assert.equal(getStringValue(), 'A');
		});

		test('3 chars', () => {
			dataBuffer = new TextEncoder().encode("_ABC");
			lastSize = dataBuffer.length - 1;
			assert.equal(getStringValue(), 'ABC');
		});
	});
});



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
