
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
					func: ['registerFileType function', "With 'registerFileType' you register the function that checks for the right file type. Your function will be called with the following parameters."],
					return: ['boolean', "Return true if the file type is right. (If file should be parsed by function in 'registerParser'.)"],
					params: [
						['fileExt', 'string', "The file extension without the '.', e.g. 'wav'"],
						['filePath', 'string', "The complete absolute path to the file."],
						['fileData', 'FileData', "You can use this to access the file data itself. Some files contain an Id at the start of the file or you might use this for message protocols where a number determines the message ID."],
					]
				},
				{
					func: ['registerParser function', "With 'registerParser' you register the function to parse and decode the file. Your function is called with no parameters."],
					params: [
						['filePath', 'string', "The complete absolute path to the file."]
					]
				}
			],
		],
		['Inside function installed with registerFileType',
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
		['Inside function installed with registerParser',
			[
				{
					func: ['addStandardHeader', 'Adds a standard header. This includes the size of the file.']
				},
				{
					func: ['read', 'Advances the offset (from previous call) and stores the size for reading.'],
					params: [
						['size?', 'number', 'The number of bytes to read. If undefined, all remaining data is read. If negative the offset is moved backwards.']
					]
				},
				{
					func: ['readUntil', "Advances the offset until the 'value' is found.\nMost prominent use case for this is to read all data of a C- string.\nNote: The read bytes do not contain 'value'."],
					params: [
						['value?', 'number', 'The value to search for. Searches byte-wise. Defaults to 0.']
					]
				},
				{
					func: ['readRowWithDetails', "Reads data and creates a row with expandable details. Use this for expandable rows where the size is not clear until the details have been parsed."],
					params: [
						['name', 'string', "The name of the value."],
						['func', '() => {value?: string | number, description?: string, valueHover?: string | number} | void, opened = false)', "The function to call to parse/decode the data. The function can return an object which is used for the row's 'value' and 'description'."],
						['opened', 'boolean', "true=the details are opened on initial parsing. false (default)=The details are initially closed."],
						['hexOffset?', 'boolean', "(Optional) Display Offset with hex. false (default)=The Offset initially uses decimal."]
					]
				},
				{
					func: ['readBits', 'Advances the offset (from previous call) bitwise and stores the size for reading.'],
					params: [
						['size', 'number', 'The number of bits to read.']
					]
				},
				{
					func: ['setOffset', "Sets the absolute file pointer offset."],
					params: [
						['offset', 'number', 'The file pointer offset.']
					]
				},
				{
					func: ['getOffset', "Returns the absolute file pointer offset. Useful if it is required to restore the file pointer later."],
					return: ['number', "The current file pointer offset."],
				},
				{
					func: ['endOfFile', "Checks if the parsed file has reached it's end."],
					return: ['boolean', "true if end of file reached."],
				},
				{
					func: ['getRemainingSize', "Returns the number of remaining bytes available for the **next** read(...) command. If executed before any read(...) command it returns the size of the parsed file."],
					return: ['number', "Count of remaining bytes in the file."],
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
						['description?', 'string', "(Optional) A description of the entry"],
						['valueHover?', 'string|number', "(Optional) Is displayed on hovering over the 'value'."],
						['hexOffset?', 'boolean', "(Optional) Display Offset with hex."]
					]
				},
				{
					func: ['addDetails', "Parses the details of an object.\nParsing starts where the last 'read' started.\nParsing is done either immediately or delayed, i.e.on opening the section."],
					params: [
						['func', '() => void', "The function to call to parse/decode the data."],
						['opened', 'boolean', "true=the details are opened on initial parsing. false (default)=The parsing is not done immediately but is postponed until the section is expanded."]
					]
				},
				{
					func: ['convertToHexString', 'Converts the given number value into a hex string. Use only on positive numbers.'],
					return: ['string', "E.g. '0F' or '12FA'"],
					params: [
						['value', 'number', "The value to convert."],
						['size', 'number', "The number of digits (e.g. 2 or 4)"]
					]
				},
				{
					func: ['getNumberValue', 'The value from the dataBuffer as number value. Note: For numbers bigger than 2^53 - 1 (9.007.199.254.740.991) the value becomes inaccurate.'],
					return: ['number', "The decoded number."]
				},
				{
					func: ['getSignedNumberValue', 'The value from the dataBuffer as signed number value. Note: For numbers out of the range [2^53 - 1, -(2^53 - 1)] (+/-9.007.199.254.740.991) the value becomes inaccurate.'],
					return: ['number', "The decoded number. (If the highest bit is set the number is interpreted as negative number.)"]
				},
				{
					func: ['getFloatNumberValue', 'The value from the dataBuffer as signed float value according IEEE754. This can be either single (4 bytes) or double precision (8 bytes). If the data size is a different value an error is thrown.'],
					return: ['number', "The decoded float number."]
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
					func: ['getDecimalValue', 'The value from the dataBuffer as decimal string. Interprets the value as unsigned int. Hovering will show the hex value.'],
					return: ['string', "E.g. '5768'"]
				},
				{
					func: ['getSignedDecimalValue', 'The value from the dataBuffer as decimal string. Interprets the value as signed int. Hovering will show the hex value.'],
					return: ['string', "E.g. '-1234'"]
				},
				{
					func: ['getStringValue', 'The value from the dataBuffer as string.'],
					return: ['string', "E.g. '0x7FA0'"]
				},
				{
					func: ['addMemDump', 'Adds a memory dump (hex and ASCII) for the data from the dataBuffer.'],
					params: [
						['enableAscii', 'boolean', "true (default)=ASCII decoding enabled. false=no ASCII decoding."]
					]
				},
				{
					func: ['addChart', 'Creates a chart. E.g. a line chart or a bar chart.\nUse this to visualize series data.'],
					params: [
						['config', "{type?:'line'|'bar', series:(number[]|Series)[]}", "type: A line or bar chart. Defaults to 'line'.\n'series': An array which contains either number arrays(obtained by 'getData') or 'Series' structures if you need more control.\nA Series structure contains:\n- samples: The data number array.\n- label: A name for the data series.\n- color: The color of the data series, e.g. 'green'."],
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
					func: ['setRowValue', "Sets the 'value' cell of the current row. Normally you can set the value directly in 'addRow' or 'readRowWithDetails'. This command can be used for special cases where the value is not known at the time the both functions are called."],
					params: [
						['value', 'String | string | number', "The value to set."],
						['valueHover?', 'string|number', "(Optional) Is displayed on hovering over the 'value'."]
					]
				},
				{
					func: ['createSeries', 'Creates a series from a number array.\nAdds a label and a color.'],
					return: ['Series', 'A Series object with samples, label and color info.\n~~~js\ninterface Series {\n  samples: number[],\n  label: string,\n  color: string\n~~~\n}'],
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
				},
				{
					func: ['dbgStop', 'Stops the execution of the parser script.\nCan be used for debugging the script.']
				},
				{
					func: ['dbgLog', 'Outputs into the OUTPUT pane under "Binary File Viewer". Use this for logging purposes.'],
					params: [
						['...args', 'various', "You can give several arguments with data you want to log. But it will not print more complex data like objects."
						]
					]
				},
				{
					func: ['dbgOverrideDetailsOpen', "Overrides the open/closed state of following 'details' commands. Can be used for debugging purposes to e.g. temporary open all 'details' during parsing.Removing the need to manually open the 'details' on each change in the parser js file."],
					params: [
						['open', 'boolean', "- true: All following 'details' commands will be initially open. Regardless of the individual setting.\n- false: All following 'details' commands will be initially closed. Regardless of the individual setting.\n- undefined: Switch back to normal behavior.The individual setting will be used."
						]
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
	public static search(label: string): FuncDoc | undefined {
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
				for (const param of funcDoc.params ?? []) {
					md += '_' + param[0] + '_: ' + param[2] + '\n\n';
				}
				// Add return value
				if (funcDoc.return?.[1])
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
