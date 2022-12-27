/**
 * Selects the 'obj' extension.
 */
registerFileType((fileExt, filePath, data) => {
	// Check for obj
	return (fileExt === 'obj2');
});



/**
 * Parser for obj2 files.
 * Tests the bit parsing, readRowWithDetails (for bits) and setRowValue.
 */
registerParser(() => {

	addStandardHeader();

	read(2);
	addRow('WORD 1', getHexValue());

	read(2);
	addRow('WORD 2', getHexValue());

	readRowWithDetails('Flags 0', () => {
		readBits(1);
		addRow('Bit 0', getBitsValue(), '');
		read(2);
		addRow('Byte 1', getBitsValue(), '');
		readBits(13);
		addRow('13 bits', getBitsValue(), '');
		readBits(2);
		addRow('Bit 13', getBitsValue(), '');
	}, true);
	// Show mixed (byte + bits) value.
	setRowValue(getBitsValue());

	read(1);
	addRow('BYTE 1', getHexValue());

	readRowWithDetails('Flags 1', () => {
		readBits(1);
		readBits(3);
		addRow('Count', getDecimalValue(), 'Bits 1-3');
		readBits(4);
		addRow('Reserved');
	}, true);
	// Show mixed (byte + bits) value.
	setRowValue(getBitsValue());

	addRow('Same Flags 1', getBitsValue());

	read(1);
	addRow('BYTE 2', getHexValue());

	readRowWithDetails('Bytes', () => {
		read(1);
		addRow('Byte 0', getNumberValue());
		read(3);
		addRow('Count', getDecimalValue());
		read(4);
		addRow('Reserved');
	}, true);

});


