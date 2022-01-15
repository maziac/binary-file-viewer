
/**
 * Type for the function documentations.
 */
export interface FuncDoc {
	func: string[],	// function name, description
	return?: string[],	// return type, description
	params?: string[][]	// param name, type, description
}


/**
 * The documentation of all functions.
 * The map contains 2 scopes:
 * - registerFileType
 * - registerParser
 */
export class FunctionDocumentation {

	// All API functions are documented below.
	public static funcDocs = new Map<string, FuncDoc[]>([
		['General',
			[
				{
					func: ['registerFileType', "Registers the function that checks for the right file type."],
					return: ['number[]', "A number array with the values. The length of the array might be smaller than 'length' if the file size is smaller."],
					params: [
						['fileExt', 'string', "The file extension without the '.', e.g. 'wav'"],
						['filePath', 'string', "The complete absolute path to the file."],
						['fileData', 'FileData', "You can use this to access the file data itself. Some files contain an Id at the start of the file or you might use this for message protocols where a number determines the message ID."],
					]
				},
				{
					func: ['registerParser', "Registers the function to parse and decode the file."]
				}
			],
		],
		['Function registerFileType',
			[
				{
					func: ['fileData.getBytesAt', "Returns the bytes from the file at the given offset.\nUse this inside 'registerFileType' to examine the file type."],
					return: ['number[]', "A number array with the values. The length of the array might be smaller than 'length' if the file size is smaller."],
					params: [
						['offset', 'number', "The file offset."],
						['length', 'number', "The number of bytes to return. Defaults to 1"]
					]
				},
				{
					func: ['fileData.getFileSize', "Returns the file size."],
					return: ['number', "The file size in bytes."]
				}
			],
		],
		['Function registerParser',
			[
				{
					func: ['addStandardHeader', 'Adds a standard header. This includes the size of the file.']
				},
				{
					func: ['read', 'Advances the offset (from previous call) and stores the size for reading.'],
					params: [
						['size?', 'number', 'The number of bytes to read. If undefined, all remaining data is read.']
					]
				},
				{
					func: ['readUntil', "Advances the offset until the 'value' is found.\nMost prominent use case for this is to read all data of a C- string.\nNote: The read bytes do not contain 'value'."],
					params: [
						['value?', 'number', 'The value to search for. Searches byte-wise. Defaults to 0.']
					]
				},
				{
					func: ['readBits', 'Advances the offset (from previous call) bitwise and stores the size for reading.'],
					params: [
						['size', 'number', 'The number of bits to read.']
					]
				},
				{
					func: ['setEndianness', 'Set the endianness for data reads.'],
					params: [
						['endianness', 'string', "Either 'little'(default ) or 'big'."]
					]
				},
				{
					func: ['addRow', 'Creates a new row for the table.'],
					params: [
						['name', 'string', "The name of the value."],
						['value?', 'string|number', "(Optional) The value to display."],
						['shortDescription?', 'string', "(Optional) A short description of the entry"]
					]
				},
				{
					func: ['addDetails', "Parses the details of an object.\nParsing starts where the last 'read' started.\nParsing is done either immediately or delayed, i.e.on opening the section."],
					params: [
						['func', '() => void', "The function to call to parse/decode the data."],
						['opened', 'boolean', "true=the details are opened on initial parsing. false(default)=The parsing is not done immediately but is postponed until the section is expanded."]
					]
				},
				{
					func: ['convertToHexString', 'Converts the given number value into a hex string.'],
					return: ['string', "E.g. '0F' or '12FA'"],
					params: [
						['value', 'number', "The value to convert."],
						['size', 'number', "The number of digits (e.g. 2 or 4)"]
					]
				},
				{
					func: ['getNumberValue', 'The value from the dataBuffer as number value.'],
					return: ['number', "The decoded number."]
				},
				{
					func: ['getBitsValue', 'The bits from the dataBuffer.'],
					return: ['string', "E.g. '001101'"]
				},
				{
					func: ['getHexValue', "The value from the dataBuffer as hex string."],
					return: ['string', "E.g. '7FA0'"]
				},
				{
					func: ['getHex0xValue', "The value from the dataBuffer as hex string + '0x' in front."],
					return: ['string', "E.g. '0x7FA0'"]
				},
				{
					func: ['getDecimalValue', 'The value from the dataBuffer as decimal string.'],
					return: ['string', "E.g. '5768'"]
				},
				{
					func: ['getStringValue', 'The value from the dataBuffer as string.'],
					return: ['string', "E.g. '0x7FA0'"]
				},
				{
					func: ['addMemDump', 'Adds a memory dump (hex and ASCII) for the data from the dataBuffer.']
				},
				{
					func: ['addChart', 'Creates a chart. E.g. a line chart or a bar chart.\nUse this to visualize series data.'],
					params: [
						['config', "{type:'line'|'bar', series:(number[]|Series)[]}", "series: An array which contains either number arrays(obtained by 'getData') or 'Series' structures if you need more control.\nA Series structure contains:\n- samples: The data number array.\n- label: A name for the data series.\n- color: The color of the data series, e.g. 'green'."],
						['name', 'string', "The name of the chart."]
					]
				},
				{
					func: ['getData', 'Reads in a chunk of data. E.g. to display later in Charts.'],
					return: ['number[]', 'The samples in a number array.'],
					params: [
						['sampleSize?', 'number', "(Optional) The size of each data value (sample) in bytes. Defaults to 1."],
						['offset?', 'number', "(Optional) The starting offset in bytes. Defaults to 0."],
						['format?', 'string', "(Optional) 'u'=unsigned, 'i'=signed. Defaults to 'u'."],
						['skip?', 'number', "(Optional) The number of bytes to skip after each read sample. Defaults to 0."]
					]
				},
				{
					func: ['createSeries', 'Creates a series from a number array.\nAdds a label and a color.'],
					return: ['Series', 'A Series object with samples, label and color info.\n~~~\ninterface Series {\n  samples: number[],\n  label: string,\n  color: string\n~~~\n}'],
					params: [
						['samples', 'number[]', "The data number array."],
						['color?', 'string', "Optional. The color to use."],
						['label?', 'string', "Optional. A string to mark the series."]
					]
				},
				{
					func: ['addCanvas', 'Creates a canvas object inside a table row.\nIt returns a context that can be used for drawing.'],
					return: ['CanvasRenderingContext2D', 'The rendering context for the canvas'],
					params: [
						['width', 'number', "The physical width in pixel."],
						['height', 'number', "The physical height in pixel."],
						['name?', 'string', "Optional. A name (title) to show above the canvas."]
					]
				}
			]
		]
	]);


	/**
	 * Return the matching function description.
	 * @param label The name to search for.
	 * @returns a funcDoc object that matches or undefined if nothing matches.
	 */
	public static search(label: string): FuncDoc {
		for (const [, funcDocs] of this.funcDocs) {
			for (const funcDoc of funcDocs) {
				const funcName = funcDoc.func[0];
				if (funcName == label)
					return funcDoc;
			}
		}
		return undefined;
	}


	/**
	 * Returns the markdown description of all functions.
	 * Orders them by scope.
	 * Each scope ('general', 'registerFileType' and 'registerParser') gets
	 * an own chapter.
	 */
	public static getMarkdown(): string {
		let md = '## Function Documentation\n\n';

		// First loop: all scopes
		for (const [scope, funcDocs] of this.funcDocs) {
			md += '### ' + scope + '\n\n';
			// Now all functions
			for (const funcDoc of funcDocs) {
				// Title
				const funcSignature = this.getFuncSignature(funcDoc);
				md += '#### ```' + funcSignature + '```\n\n';
				// Add description
				md += funcDoc.func[1] + '\n\n';
				// Add parameters
				for (const param of funcDoc.params||[]) {
					md += '_' + param[0] + '_: ' + param[2] + '\n\n';
				}
				// Add return value
				if (funcDoc.return && funcDoc.return[1])
					md += '_Returns_: ' + funcDoc.return[1] + '\n\n';
			}
		}

		return md;
	}


	/**
	 * Returns the function signature.
	 * @param funcDoc A func doc object.
	 * @returns E.g. 'addCanvas(width number, height: number, name?: string): CanvasRenderingContext2D'
	 */
	public static getFuncSignature(funcDoc: FuncDoc): string {
		// Create label, full signature
		let label = funcDoc.func[0] + '(';
		// Collect all params
		if (funcDoc.params) {
			let sep = '';
			for (const param of funcDoc.params||[]) {
				label += sep + param[0] + ': ' + param[1];
				sep = ', ';
			}
		}
		label += ')';
		// Return value
		if (funcDoc.return)
			label += ': ' + funcDoc.return[0];

		// Return
		return label;
	}

}
