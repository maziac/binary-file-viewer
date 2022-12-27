/**
 * Select the 'pic' as file extension.
 * pic is a proprietary picture format that just carries the
 * width and height of the image and the image data itself.
 * Simple uncompressed RGB values.
 */
registerFileType((fileExt, filePath, fileData) => {
	// Check for the right file extension
	return (fileExt === 'pic');
});


/**
 * The parser to decode the file.
 * To decode the image data a canvas is created.
 * Afterwards the data is read from the file and put into the
 * graphics context of the canvas.
 */
registerParser(() => {
	addStandardHeader();

	read(2);
	const width = getNumberValue();
	addRow('Width', width, 'Picture width');

	read(2);
	const height = getNumberValue();
	addRow('Height', height, 'Picture height');

	const ctx = addCanvas(width, height);
	const canvasData = ctx.getImageData(0, 0, width, height);
	const data = canvasData.data;

	// Read data and fill the canvas.
	// Data are simple RGB values.
	let i = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			// Read RGB values
			read(3);
			const rgb = getData(1, 0, 'u', 0);
			// Write RGB
			for (let k = 0; k < 3; k++) {
				data[i++] = rgb[k];
			}
			// Write default alpha value
			data[i++] = 0xFF;
		}
	}
	// Update image
	ctx.putImageData(canvasData, 0, 0);

});
