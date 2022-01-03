


/**
 * Select the files for which the parser should work.
 */
//selectFiles(fileExt: string, filePath: string, data: any): boolean
registerFileType((fileExt, filePath, data) => {
	// Check for obj
	if (fileExt == 'obj')
		return true;
	return false;
});



/**
 * My own parser.
 */
registerParser(() => {
	// Meta info
	createStandardHeader();

	// Header
	read(16);
	createNode('Header 1').open = true;
	addDetailsParsing(() => {
		// Get registers/data
		read(1);
		createNode("IK", hex0xValue(), "Interrupt Vector Register");
		read(2);
		createNode("HL'", hex0xValue(), "HL' Register");
		read(2);
		createNode("DE'", hex0xValue(), "DE' Register");
		read(2);
		createNode("BC'", hex0xValue(), "BC' Register");
		read(2);
		createNode("AF'", hex0xValue(), "AF' Register");
		read(2);
		createNode("HL", hex0xValue(), "HL Register");
		read(2);
		createNode("DE", hex0xValue(), "DE Register");
		read(2);
		createNode("BC", hex0xValue(), "BC Register");
		read(1);
		createNode("Border", "Color", "Memory Refresh Register");
		addHoverValue(hex0xValue());
	});
});


