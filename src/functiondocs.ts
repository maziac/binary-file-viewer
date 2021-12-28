
/**
 * Type for the function documentations.
 */
export interface FuncDoc {
	func: string[],	// function name, description
	return: string[],	// return type, description
	params: string[][]	// param name, type, description
}



/**
 * The documentation of all functions.
 */

export let funcDocs: FuncDoc[] = [
	{
		func: ['myFunc', 'Reads in a chunk of data.\nE.g. to display later in Charts.'],
		return: ['string', 'The data as a string.'],
		params: [
			['format', 'string', "'u'=unsigned, 'i'=signed"],
			['skip', 'number', 'The number of bytes to skip after each read sample.']
		]
	}
];
