/**
 * Selects the 'obj' extension.
 */
registerFileType((fileExt, filePath, data) => {
	// Check for obj
	return (fileExt === 'obj');
});



/**
 * Parser for obj files that contain text.
 * Is used to demonstrate usage of 2 parsers for the same file type (.obj).
 */
registerParser(() => {

	addStandardHeader();

	read(160);
	addRow('Text');
	addDetails(() => {
		read(160);
		addTextBox(getStringValue(), 100, 200);
	}, true);

});


