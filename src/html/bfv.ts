declare function addStandardHeader(): void;
declare function addDetails(func: () => void, opened: boolean): void;
declare function addMemDump(): void;

declare function addChart(config: any, name: string): void;
declare function addRow(name: string, valString: string, shortDescription: string): HTMLTableRowElement;




/**
 * All API functions are collected here as static functions.
 * Bfv = Binary File Viewer.
 */
export class Bfv {

	/**
	 * Add a standard header, i.e. the size of the file.
	 */
	public static addStandardHeader() {
		addStandardHeader();
	}


	/**
	 * Advances the offset (from previous call) and
	 * stores the size for reading.
	 * @param size The number of bytes to read. // TODO: allow undefined to read everything till end of file.
	 */
	public static read(size: number) {
		read(size);
	}


	/**
	 * Creates a new row for the table.
	 * @param name The name of the value.
	 * @param valString (Optional) The value to show as a string.
	 * @param shortDescription (Optional) A short description of the entry.
	 */
	public static addRow(name: string, valString = '', shortDescription = '') {
		addRow(name, valString, shortDescription);
	}


	/**
	 * Parses the details of an object.
	 * Parsing starts where the last 'read' started.
	 * Parsing is done either immediatly or delayed, i.e. on opening the section.
	 * @param func The function to call to parse/decode the data.
	 * @param opened true=the details are opened on initial parsing.
	 * false (default)=The parsing is not done immediately but is postponed until the
	 * section is expanded.
	 */
	public static addDetails(func: () => void, opened = false) {
		addDetails(func, opened);
	}


	// TODO:
	public static addHoverValue() {
		//
	}

	// TODO:
	public static addDescription() {
		//
	}




	/**
	 * Converts thegiven number value into a hex string.
	 * @param value The value to convert.
	 * @param size The number of digits (e.g. 2 or 4)
	 * @returns E.g. "0Fh" or "12FAh"
	 */
	public static convertToHexString(value: number, size: number): string {
		return convertToHexString(value, size);
	}


	/**
	 * @returns The value from the dataBuffer as hex string + "0x" in front.
	 */
	public static getHex0xValue(): string {
		return getHex0xValue();
	}


	/**
	 * @returns The value from the dataBuffer as hex string.
	 */
	public static getHexValue(): string {
		return getHexValue();
	}


	/**
	 * @returns The value from the dataBuffer as number value.
	 */
	public static getNumberValue(): number {
		return getNumberValue();
	}


	/**
	 * @returns The value from the dataBuffer as decimal string.
	 */
	public static getDecimalValue(): string {
		return getDecimalValue();
	}


	/**
	 * @returns The data from the dataBuffer as string.
	 */
	public static getStringValue(): string {
		return getStringValue();
	}


	/**
	 * Adds a memory dump (hex and ASCII) for the data from the dataBuffer.
	 */
	public static addMemDump() {
		addMemDump();
	}


	/**
	 * Creates a chart. E.g. a line chart or a bar chart.
	 * Use this to visualize series data.
	 * @param config The chart configuration:
	 * type: 'line' | 'bar'
	 * series: An array which contains either number arrays (obtained by 'getData')
	 * or 'Series' structures if you need more control.
	 * A Series structure contains:
	 * samples: The data number array.
	 * label: A name for the data series.
	 * color: The color of the data series, e.g. 'green'.
	 * @param name The name of the chart.
	 */
	public static addChart(config: ChartConfig, name: string) {
		addChart(config, name);
	}


	/**
	 * Reads in a chunk of data. E.g. to display later in Charts.
	 * @param sampleSize The size of each data value (sample) in bytes.
	 * @param offset The starting offset in bytes.
	 * @param format 'u'=unsigned, 'i'=signed
	 * @param skip The number of bytes to skip after each read sample.
	 */
	public static getData(sampleSize: number, offset: number, format: string, skip: number): number[] {
		return getData(sampleSize, offset, format, skip);
	}


/**
 * Creates a series from a number array.
 * Adds a label and a color.
 * @param samples The data number array.
 * @param color Optional. The color to use.
 * @param label Optional. A string to mark the series.
 */
	public static createSeries(samples: number[], color?: string, label?: string): Series {
		return createSeries(samples, color, label);
	}
}
