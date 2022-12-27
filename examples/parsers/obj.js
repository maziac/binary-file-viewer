/**
 * Selects the 'obj' extension.
 */
registerFileType((fileExt, filePath, data) => {
	// Check for obj
	return (fileExt === 'obj');
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
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (positive)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (positive) with hover', getSignedDecimalValue());
	read(2);
	addRow('As hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());

	read(4);
	addRow('0008d075 as hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());

	read(8);
	addRow('0000000000D26F07 as hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());

	read(1);
	addRow('0xFE as hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());

	read(8);
	addRow('FFFFFFFFFFFFFFFD (-3) as hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());

	read(1);

	read(8);
	addRow('-30000 as hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());

	read(1);
	read(8);
	addRow('-300000 as hex', getHex0xValue());
	addRow('As getDecimalValue', getDecimalValue());
	addRow('As getSignedNumberValue (negative)', getSignedNumberValue());
	addRow('As getSignedDecimalValue (negative) with hover', getSignedDecimalValue());



});


