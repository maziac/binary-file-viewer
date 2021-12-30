
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
		['general',
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
		['registerFileType',
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
					func: ['getFileSize', "Returns the file size."],
					return: ['number', "The file size in bytes."]
				}
			],
		],
		['registerParser',
			[
				{
					func: ['addStandardHeader', 'Add a standard header. This includes the size of the file.']
				},
				{
					func: ['', 'Advances the offset (from previous call) and stores the size for reading.'],
					params: [
						['size', 'number', 'The number of bytes to read.']
					]
				},
				{
					func: ['addRow', 'Creates a new row for the table.'],
					params: [
						['name', 'string', "The name of the value."],
						['value', 'string|number', "(Optional) The value to display."],
						['shortDescription', 'string', "(Optional) A short description of the entry"]
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
						['sampleSize', 'number', "The size of each data value (sample) in bytes."],
						['offset', 'number', "The starting offset in bytes."],
						['format', 'string', "'u'=unsigned, 'i'=signed."],
						['skip', 'number', "The number of bytes to skip after each read sample."]
					]
				},
				{
					func: ['createSeries', 'Creates a series from a number array.\nAdds a label and a color.'],
					return: ['Series', 'A Series object with samples, label and color info.\ninterface Series {\n  samples: number[],\n  label: string,\n  color: string\n}'],
					params: [
						['samples', 'number[]', "The data number array."],
						['color?', 'string', "Optional. The color to use."],
						['label?', 'string', "Optional. A string to mark the series."]
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
}
