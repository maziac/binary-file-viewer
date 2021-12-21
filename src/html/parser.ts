declare var acquireVsCodeApi: any;
declare var document: Document;
declare var window: Window & typeof globalThis;
declare var navigator: Navigator;
declare var ImageConvert: any;
declare var UlaScreen: any;

const vscode = acquireVsCodeApi();


/**
 * This js script parses a file, does all the decoding and presents the
 * data in the webview.
 * It is done as script inside the webview (opposed to creating a html file in
 * the extension) to allow lazy loading.
 * Large blocks of data are skipped in the initial pass and decoded only
 * when needed. I.e. when the user expands an item.
 */


// The data to parse.
var dataBuffer: Uint8Array;

// The custom parser (js program as a string).
var customParser: string;

// Index into snaData
var lastOffset: number;

// The last retrieved data size.
var lastSize: number;

// The root node for parsing. New objects are appended here.
var lastNode: any;

// The correspondent node for the details.
var lastContentNode: any;

// The last node used for the title.
var lastNameNode: any;

// The last node used for the value.
var lastValueNode: any;

// The last node used for the short description.
var lastDescriptionNode: any;

// The last node used for the long description.
var lastLongDescriptionNode: any;


/**
 * Call to check a value.
 * Does nothing.
 * You can set a breakpoint here.
 */
function assert(condition: boolean) {
	if (!condition) {
		console.error('Error!');
	}
}


/**
 * Convert array to base 64 string.
 */
function arrayBufferToBase64(buffer: any) {
	var binary = '';
	var bytes = [].slice.call(new Uint8Array(buffer));
	bytes.forEach((b: any) => binary += String.fromCharCode(b));
	return window.btoa(binary);
}


/**
 * Can be called by the custom parser to create the standard header.
 * I.e. showing the size.
 */
function createStandardHeader() {
	let html = `<div><b>Size: ${dataBuffer.length}</b><br>`;
	lastNode.innerHTML = html;
}


/**
 * Creates a node and appends it to lastNode.
 * @param name The name of the value. E.g. "SP".
 * @param valString The value to show.
 * @param shortDescription A short description of the entry.
 */
function createNode(name: string, valString = '', shortDescription = ''): HTMLDetailsElement {
	// Create new node
	const node = document.createElement("DETAILS") as HTMLDetailsElement;
	node.classList.add("nomarker");
	//node.classList.add("basenode");
	const lastOffsetHex = getHexString(lastOffset, 4);
	const lastSizeHex = getHexString(lastSize, 4);
	const html = `
<summary>
	<div class="offset" title="Offset\nHex: ${lastOffsetHex}">${lastOffset}</div>
	<div class="size" title="Size\nHex: ${lastSizeHex}">${lastSize}</div>
	<div class="name">${name}</div>
	<div class="value">${valString}</div>
	<div class="description">${shortDescription}</div>
</summary>
<div class="indent"></div>
`;
	node.innerHTML = html;

	// Get child objects
	const childrenNode = node.childNodes;
	lastContentNode = childrenNode[3];
	const summary = childrenNode[1];
	const children = summary.childNodes;
	lastNameNode = children[5];
	lastValueNode = children[7];
	lastDescriptionNode = children[9];
	const descriptionChildren = lastDescriptionNode.childNodes;
	lastLongDescriptionNode = descriptionChildren[3];

	// Append it
	lastNode.appendChild(node);

	// Return
	return node;
}


/**
 * Adds a long description.
 * Will be shown when expanded.
 */
function addDescription(longDescription: string) {
	//lastLongDescriptionNode.innerHTML = longDescription;
	beginDetails();
	createDescription(convertLineBreaks(longDescription));
	endDetails();
}


/**
 * Converts \n into <br>.
 */
function convertLineBreaks(s: string) {
	return s.replace(/\n/g, '<br>');
}


/**
 * Sets lastNode to it's last child.
 * This begins a details sections.
 * Indents.
 */
function beginDetails() {
	const node = lastNode.lastChild;
	node.classList.remove("nomarker");
	lastNode = lastContentNode;
}


/**
 * Ends a details sections.
 * Sets lastNode to it's parent.
 * Indents.
 */
function endDetails() {
	lastNode = lastNode.parentNode.parentNode;
}


/**
 * Parses the details of an object.
 * Parsing is done immediately.
 * Uses begin/endDetails.
 * @param func The function to call to parse/decode the data.
 */
function addDetailsParsing(func: () => void) {
	// "Indent"
	beginDetails();
	// Call function
	const bakLastOffset = lastOffset;
	const bakLastSize = lastSize;
	lastSize = 0;
	func();
	lastOffset = bakLastOffset;
	lastSize = bakLastSize;
	// Close/leave
	endDetails();
}


/**
 * Installs a listener for the toggle event.
 * The parsing of the data is delayed until toggling.
 * @param func The function to call to parse/decode the data.
 */
function addDelayedDetailsParsing(func: () => void) {
	// Get nodex
	const detailsNode = lastNode.lastChild;
	detailsNode.classList.remove("nomarker");
	// Attach attribute
	detailsNode.setAttribute('data-index', lastOffset.toString());
	// Install listener
	if (func) {
		detailsNode.addEventListener("toggle", function handler(this: any, event: any) {
			// Get parse node and index
			lastNode = event.target;
			const indexString = lastNode.getAttribute('data-index');
			lastOffset = parseInt(indexString);
			lastSize = 0;
			func();
			this.removeEventListener("toggle", handler);
		});
	}
}


/**
 * Creates a description line of contents.
 * Is gray.
 * @param descr The description string. Any linebreaks are converted into '<br>'.
 */
function createDescription(descr: string) {
	// Create new node
	const node = document.createElement("DIV");
	// Add description
	node.innerHTML = convertLineBreaks(descr);
	// Apply style gray
	node.classList.add('gray');
	// Append it
	lastNode.appendChild(node);
}


/**
 * Creates an element with a number of columns.
 * Without any index and size columns.
 * @param name The name of the value. E.g. "SP".
 * @param valString The value to show.
 * @param shortDescription A short description of the entry.
 */
function createSimpleRow(name: string, valString = '', shortDescription = '') {
	// Create new node
	const node = document.createElement("DETAILS");
	node.classList.add("nomarker");
	const html = `
<summary>
	<div class="offset"></div>
	<div class="size"></div>
	<div class="name">${name}</div>
	<div class="value">${valString}</div>
	<div class="description">${shortDescription}</div>
</summary>
<div class="indent"></div>
`;
	node.innerHTML = html;

	// Get child objects
	const childrenNode = node.childNodes;
	lastContentNode = childrenNode[3];
	const summary = childrenNode[1];
	const children = summary.childNodes;
	lastNameNode = children[5];
	lastValueNode = children[7];
	lastDescriptionNode = children[9];
	const descriptionChildren = lastDescriptionNode.childNodes;
	lastLongDescriptionNode = descriptionChildren[3];

	// Append it
	lastNode.appendChild(node);

	// Return
	return node;
}


/**
 * Adds a hover text to lastValueNode.
 * @param hoverValueString String to show on hover for the title. Can be undefined.
 */
function addHoverValue(hoverValueString: string) {
	lastValueNode.title = hoverValueString;
}


/**
 * Returns a hex string.
 * @param value The value to convert.
 * @param size The number of digits (e.g. 2 or 4)
 * @returns E.g. "0Fh" or "12FAh"
 */
function getHexString(value: number, size: number): string {
	if (value == undefined)
		return "".padStart(size, '?');
	const s = value.toString(16).toUpperCase().padStart(size, '0');
	return s;
}


/**
 * Advances the offset (from previous call) and
 * stores the size for reading.
 * @param size The number of bytes to read.
 */
function read(size: number) {
	lastOffset += lastSize;
	lastSize = size;
}


/**
 * Reads the value from the buffer.
 */
function getValue(): number {
	let value = dataBuffer[lastOffset];
	let factor = 1;
	for (let i = 1; i < lastSize; i++) {
		factor *= 256;
		value += factor * dataBuffer[lastOffset + i];
	}
	return value;
}


/**
 * @returns The value from the dataBuffer as decimal string.
 */
function decimalValue(): string {
	const val = getValue();
	return val.toString();
}


/**
 * @returns The value from the dataBuffer as hex string.
 */
function hexValue(): string {
	const val = getValue();
	let s = val.toString(16).toUpperCase();
	s = s.padStart(lastSize * 2, '0');
	return s;
}

/**
 * @returns The value from the dataBuffer as hex string + "0x" in front.
 */
function hex0xValue(): string {
	return '0x' + hexValue();
}


/**
 * @param bit The bit to test
 * @returns The bit value (0 or 1) from the dataBuffer as string.
 */
function bitValue(bit: number): string {
	const val = getValue();
	const result = (val & (1 << bit)) ? '1' : '0';
	return result;
}


/**
 * Converts a value into a bit string.
 * @param value The value to convert.
 * @param size The size of the value, e.g. 1 byte o r 2 bytes.
 * @returns The value from the dataBuffer as bit string. e.g. "0011_0101"
 */
function convertBitsToString(value: number, size: number): string {
	let s = value.toString(2);
	s = s.padStart(size * 8, '0');
	s = s.replace(/.{4}/g, '$&_');
	// Remove last '_'
	s = s.substr(0, s.length - 1);
	return s;
}

/**
 * @returns The value from the dataBuffer as bit string. e.g. "0011_0101"
 */
function bitsValue(): string {
	const val = getValue();
	return convertBitsToString(val, lastSize);
}

/**
 * Reads a text of given size.
 * @returns The data as string.
 */
function stringValue(): string {
	let s = '';
	for (let i = 0; i < lastSize; i++) {
		const c = dataBuffer[lastOffset + i];
		s += String.fromCharCode(c);
	}
	return s;
}


/**
 * Is called if the user opens the details of an item.
 * Decodes the data.
 * @param displayOffset The displayOffset is added to the index before displaying.
 * @param hoverRelativeOffset You can replace the default relative Offset hover text.
 */
function createMemDump(displayOffset = 0, hoverRelativeOffset = 'Relative Offset') {
	let html = '';
	let prevClose = '';

	// In case of an error, show at least what has been parsed so far.
	try {
		// Loop given size
		for (let i = 0; i < lastSize; i++) {
			const k = i % 16;
			// Get value
			const iOffset = lastOffset + i;	// For indexing
			const iRelOffset = displayOffset + i;	// For display
			const val = dataBuffer[iOffset];
			const valString = getHexString(val, 2);
			const valIntString = val.toString();
			const iRelOffsetHex = getHexString(iRelOffset, 4);

			// Start of row?
			if (k == 0) {
				// Close previous
				html += prevClose;
				prevClose = '</div>';

				// Check for same values
				let l = i + 1
				for (; l < lastSize; l++) {
					if (val != dataBuffer[lastOffset + l])
						break;
				}
				const l16 = l - (l % 16);
				if (l16 > i + 16) {
					// At least 2 complete rows contains same values
					if (l == lastSize)
						i = lastSize - 1;	// end
					else
						i = l16 - 1;
					const iRelOffsetHexEnd = getHexString(displayOffset + i, 4);

					const hoverTextOffset = 'Offset (hex): ' + getHexString(iOffset, 4) + '-' + getHexString(lastOffset + i, 4) + '\nValue (dec): ' + valIntString;

					const hoverTextRelOffset = 'Relative offset (dec): ' + iRelOffset + '-' + (displayOffset + i) + '\nValue (dec): ' + valIntString;

					html += '<div>';
					html += '<span class="indent mem_offset" title="' + hoverTextOffset + '">' + iOffset + '-' + (lastOffset + i) + '</span>';
					html += '<span class="mem_offset" title="' + hoverTextRelOffset + '"> (0x' + iRelOffsetHex + '-0x' + iRelOffsetHexEnd + '): </span>';
					html += '<span title="Value (dec): ' + valIntString + '"> contain all ' + valString + '</span>';
					continue;
				}

				// Afterwards proceed normal
				const iOffsetHex = getHexString(iOffset, 4);
				html += `<div class="mem_dump">
					<div class="indent mem_offset" title = "Offset\nHex: ${iOffsetHex}">${iOffset}</div>
				<div class="mem_rel_offset" title="${hoverRelativeOffset}\nDec: ${iRelOffset}">(0x${iRelOffsetHex})</div>
				`;
			}

			// Convert to html
			const hoverText = 'Offset (hex): ' + getHexString(iOffset, 4) + '\nOffset (dec): ' + iOffset + '\nRelative offset (hex): ' + iRelOffsetHex + '\nRelative offset (dec): ' + iRelOffset + '\nValue (dec): ' + valIntString;
			html += '<div class="mem_byte" title="' + hoverText + '">' + valString + '&nbsp;</div>';
		}
		// Close
		html += prevClose;
	}
	catch (e) {
		// Close
		html += prevClose;
		// Error while parsing
		html += '<div class="error indent">Error while parsing.</div>';
	}

	// Append
	lastNode.innerHTML += html;
}


/**
 * Starts the parsing.
 */
function parseStart() {
	// Reset
	lastOffset = 0;
	lastSize = 0;
	lastNode = document.getElementById("div_root");

	try {
		// Get parser and execute
		scopeLessFunctionCall(customParser, {
			registerFileType: (func: (fileExt: string, filePath: string, data: any) => boolean) => {
				// Does nothing here.
			},
			registerParser: (func: () => void) => {
				// Once the function registers it can be executed.
				// I.e. custom parsing is started:
				func();
			},
			createStandardHeader,
			read,
			createNode,
			addDetailsParsing,
			addHoverValue,
			hex0xValue
		});
	}
	catch (e) {
		// Return error
		vscode.postMessage({
			command: 'customParserError',
			text: e.stack
		});
	}
}


/**
 * Copies the complete html of the document to the clipboard.
 */
function copyHtmlToClipboard() {
	const copyText = document.documentElement.innerHTML;
	navigator.clipboard.writeText(copyText);
}


//---- Handle messages from vscode extension --------
window.addEventListener('message', event => {	// NOSONAR
	const message = event.data;
	switch (message.command) {
		case 'setData':
			{
				// Store in global variable
				dataBuffer = message.data;
				customParser = message.parser
				// Parse
				parseStart();
			} break;
	}
});

// At the end send a message to indicate that the webview is ready to receive
// data.
vscode.postMessage({
	command: 'ready'
});



/**
 * Runs a function given as string (the body only) in a safe environment.
 * I.e. the function is not able to access any global scope or block scope.
 * Any value has to be passed through the parameters.
 *
 * Example 1:
 * scopeLessFunction({a: 1, b: 2}, 'return a+b;');
 * Returns 3.
 *
 * If you want to pass a global value use e.g.:
 * scopeLessFunction('console.log("a+b=", a+b);', {a: 1, b: 2, console});
 * This prints: "a+b= 3"
 *
 * @param funcBodyString The string with the function body.
 * @param parameters The parameters to pass to the function. Direct access is only
 * possible to these parameters. E.g. {a: 1, b: 2} to pass 'a' and 'b' with the given values.
 * @returns The value the given function would return.
 * @throws An exception if the code cannot be compiled.
 */
export function scopeLessFunctionCall(funcBodyString: string, parameters = {}): any {
	//	console.time('scopeLessFunctionCall');
	const sandboxedFuncStr = 'with (sandbox) {\n' + funcBodyString + '\n}';
	const code = new Function('sandbox', sandboxedFuncStr);
	const sandboxProxy = new Proxy(parameters, {has, get});
	const result = code(sandboxProxy);
	//	console.timeEnd('scopeLessFunctionCall');
	return result;
}


// These traps intercepts 'in' operations on sandboxProxy.
// This is to prohibit access to the global object.
function has(target: any, key: any) {
	return true;
}
function get(target: any, key: any) {
	if (key === Symbol.unscopables)
		return undefined;
	return target[key]
}
