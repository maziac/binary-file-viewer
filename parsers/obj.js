

sgg sg;

/**
 * Select the files for which the parser should work.
 */
//selectFiles(fileExt: string, filePath: string, data: any): boolean
registerFileType((fileExt, filePath, data) => {
	return "myfunc";	// Allow all files
});



/**
 * My own parser.
 */
registerParser(() => {
	// Meta Info. TODO: Should be done generally.
	let html = '<div><b>Some Meta Info</b><br>';
	lastNode.innerHTML = html;
	// End meta info
	// Header
	read(16);
	createNode('Header').open = true;
	addDetailsParsing(() => {
		// Get registers/data
		read(1);
		createNode("I", hex0xValue(), "Interrupt Vector Register");
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


