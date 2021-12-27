declare var acquireVsCodeApi: any;
declare var document: Document;
declare var window: Window & typeof globalThis;
declare var navigator: Navigator;
declare var dataBuffer: Uint8Array;
declare var Bfv: any;

const vscode = acquireVsCodeApi();


/**
 * This js script parses a file, does all the decoding and presents the
 * data in the webview.
 * It is done as script inside the webview (opposed to creating a html file in
 * the extension) to allow lazy loading.
 * Large blocks of data are skipped in the initial pass and decoded only
 * when needed. I.e. when the user expands an item.
 */



// The custom parser (js program as a string).
var customParser: string;

// The root node for parsing. New objects are appended here.
var lastNode: any;

// The current row's cell that contains the collapsible icon (+)
var lastCollapsibleNode: HTMLTableCellElement;

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
 * Add a standard header, i.e. the size of the file.
 */
function addStandardHeader() {
	// TODO: Because of table this needs to be done differently
/*
	let html = `<div><b>Size: ${dataBuffer.length}</b><br>`;
	lastNode.innerHTML = html;
	*/
}


/**
 * Creates a new row for the table.
 * @param name The name of the value.
 * @param valString (Optional) The value to show as a string.
 * @param shortDescription (Optional) A short description of the entry.
 */
function addRow(name: string, valString = '', shortDescription = ''): HTMLTableRowElement {
	// Create new node
	const node = document.createElement("TR") as HTMLTableRowElement;
	const relOffset = getRelOffset();
	const relOffsetHex = convertToHexString(relOffset, 4);
	const lastSizeHex = convertToHexString(lastSize, 4);
	const prefix = (startOffset) ? '+' : '';	// '+' for relative index
	let hoverOffset = `Offset:\nHex: ${relOffsetHex}`;
	if (startOffset) {
		// Is a relative index, so show also the absolute index.
		const lastOffsetHex = convertToHexString(lastOffset, 4);
		hoverOffset += `\nAbsolute:\nDec: ${lastOffset}, Hex: ${lastOffsetHex}`;
	}
	const html = `
	<td class="collapse"></td>
	<td class="offset" title="${hoverOffset}">${prefix}${relOffset}</td>
	<td class="size" title="Size\nHex: ${lastSizeHex}">${lastSize}</td>
	<td class="name">${name}</td>
	<td class="value">${valString}</td>
	<td class="description">${shortDescription}</td>
`;
	node.innerHTML = html;

	// Get child objects
	const cells = node.cells;
	lastCollapsibleNode = cells[0];
	lastNameNode = cells[2];
	lastValueNode = cells[3];
	lastDescriptionNode = cells[4];
//	const descriptionChildren = lastDescriptionNode.childNodes;
//	lastLongDescriptionNode = descriptionChildren[3];	// TODO: Support long description

	// Append it / Insert new row
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
	beginDetails(false);
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
 * Is called by 'onclick'.
 * Collapses and expands the following row.
 */
function collapse(cell: HTMLTableCellElement) {
	const row = cell.parentElement as HTMLTableRowElement;
	// Use next row as target.
	const target_row = row.parentElement.children[row.rowIndex + 1] as HTMLTableRowElement;
	if (target_row.style.display == 'table-row') {
		cell.innerHTML = '+';
		target_row.style.display = 'none';
	} else {
		cell.innerHTML = '-';
		target_row.style.display = 'table-row';
		const event = new CustomEvent('expand');
		cell.dispatchEvent(event);
	}
}


/**
 * Adds a collapsible icon (+) and function to the current row.
 * This begins a details sections.
 * @param opened true=the details are directly shown, false=the details are initially hidden.
 */
function beginDetails(opened: boolean) {
	// Add collapsible icon (+)
	lastCollapsibleNode.innerHTML = (opened) ? '-' : '+';
	// Add function
	lastCollapsibleNode.setAttribute('onclick', 'collapse(this)');

	// Add row for the details
	const row = document.createElement("TR") as HTMLTableRowElement;
	row.style.display = (opened) ? 'table-row' : 'none';
	// Append it / Insert new row
	lastNode.appendChild(row);

	// Span over all cells and create table
	row.innerHTML = '<td></td><td colspan="100"><table width="100%"></table></td>';

	// Give the table a dark color.
	const detailsTable = row.cells[1].children[0];
	detailsTable.classList.add('embeddedtable');

	// Use new table
	lastNode = detailsTable;

	// Return
	return detailsTable;
}


/**
 * Ends a details sections.
 * Sets lastNode to it's parent.
 */
function endDetails() {
	lastNode = lastNode.parentNode.parentNode.parentNode;
}


/**
 * Parses the details of an object.
 * Parsing starts where the last 'read' started.
 * Parsing is done either immediately or delayed, i.e. on opening the section.
 * @param func The function to call to parse/decode the data.
 * @param opened true=the details are opened on initial parsing.
 * false (default)=The parsing is not done immediately but is postponed until the
 * section is expanded.
 */
function addDetails(func: () => void, opened = false) {
	// "Indent"
	beginDetails(opened);
	if (opened) {
		// Call function immediately
		const bakLastOffset = lastOffset;
		const bakLastSize = lastSize;
		const bakStartOffset = startOffset;
		lastSize = 0;
		startOffset = lastOffset;
		func();
		lastOffset = bakLastOffset;
		lastSize = bakLastSize;
		startOffset = bakStartOffset;
	}
	else {
		// Open/parse delayed
		const bakLastOffset = lastOffset;
		const baklastNode = lastNode;
		lastCollapsibleNode.addEventListener("expand", function handler(this: any, event: any) {
			this.removeEventListener("expand", handler);
			// Get parse node and index
			lastNode = event.target;
			lastOffset = bakLastOffset;
			startOffset = lastOffset;
			lastSize = 0;
			lastNode = baklastNode;
			try {
				func();
			}
			catch (e) {
				// Return error
				vscode.postMessage({
					command: 'customParserError',
					text: e.stack
				});
			}
		});

	}
	// Close/leave
	endDetails();
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
 * Adds a hover text to lastValueNode.
 * @param hoverValueString String to show on hover for the title. Can be undefined.
 */
function addHoverValue(hoverValueString: string) {
	lastValueNode.title = hoverValueString;
}


/**
 * Adds a memory dump (hex and ASCII) for the data from the dataBuffer.
 */
function addMemDump() {
	let html = '';
	let asciiHtml = '';
	let prevClose = '';
	let prevNode;
	const LINECOUNT = 16;
	const lineCountHex = LINECOUNT.toString(16);
	const prefix = (startOffset) ? '+' : '';	// '+' for relative index
	let relOffset = getRelOffset();
	let absOffset = lastOffset;

	// In case of an error, show at least what has been parsed so far.
	try {
		// Loop given size
		for (let i = 0; i < lastSize; i++) {
			const k = i % LINECOUNT;
			// Get value
			const val = dataBuffer[absOffset];
			const valHexString = convertToHexString(val, 2);
			const valIntString = val.toString();
			const relOffsetHex = convertToHexString(relOffset, 4);
			const absOffsetHex = convertToHexString(absOffset, 4);

			// Start of row?
			if (k == 0) {
				// Close previous
				if(prevNode)
					prevNode.innerHTML = html + asciiHtml + '</td>';

				// Create new row
				prevNode = document.createElement("TR") as HTMLTableRowElement;
				lastNode.appendChild(prevNode);
				html = '';
				asciiHtml = '<span class="mem_ascii"></span> ';	// Start with some space

				// Hover texts for the offset
				let hoverOffset = `Offset:\nDec: ${relOffset}, Hex: ${relOffsetHex}`;
				if (startOffset) {
					// Is a relative index, so show also the absolute index.
					hoverOffset += `\nAbsolute:\nDec: ${absOffset}, Hex: ${absOffsetHex}`;
				}

				// Afterwards proceed normal
				html += `<td class="collapse"></td>
					<td class="offset" title="${hoverOffset}">${prefix}${relOffset}</td>
					<td class="size" title="Size:\Dec: ${LINECOUNT}Hex: ${lineCountHex}">${LINECOUNT}</td>
					<td class="value" colspan="100">
				`;
				// <td colspan="2" title = "Offset\nHex: ${iOffsetHex}" > ${iOffset}
				// <td title="${hoverRelativeOffset}\nDec: ${iRelOffset}" > (0x${iRelOffsetHex})</td>
			}

			// Convert each byte to html
			let hoverText = `Absolute offset:\nDec: ${absOffset}, Hex: ${absOffsetHex}\nValue:\nDec: ${valIntString}, Hex: ${valHexString}`;
			if (startOffset) {
				// Add relative offset text
				hoverText = `Offset:\nDec: ${relOffset}, Hex: ${relOffsetHex}\n` + hoverText;
			}
			html += '<span class="mem_byte" title="' + hoverText + '">' + valHexString + '</span>';

			// Convert to ASCII
			const txt = (val < 32) ? '.' : String.fromCharCode(val);
			asciiHtml += '<span class="description mem_ascii" title="' + hoverText + '">' + txt + '</span>';

			// Next
			relOffset++;
			absOffset++;
		}
	}
	catch (e) {
		// Close previous
		if (prevNode)
			prevNode.innerHTML = html + asciiHtml + '</td>';
		// Error while parsing
		throw new Error("Error in createMemDump: " + e);

	}

	// Close previous
	if (prevNode)
		prevNode.innerHTML = html + asciiHtml + '</td>';
}


/**
 * Starts the parsing.
 */
function parseStart() {
	// Reset
	lastOffset = 0;
	startOffset = lastOffset;
	lastSize = 0;
	lastNode = document.getElementById("div_root");
	lastNode.innerHTML = '';	// Remove any previous data

	// Create table with header row
	lastNode.innerHTML = `
	<table>
		<tr>
			<th class="collapse"></td>
			<th class="offset">Offset</th>
			<th class="size">Size</th>
			<th class="name">Name</th>
			<th class="value">Value</th>
			<th class="description">Description</th>
		</tr>
	</table>`;
	// Use table
	lastNode = lastNode.children[0];


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
			addStandardHeader,
			read,
			addRow,
			addDetails,
			addHoverValue,
			getHex0xValue,
			getNumberValue,
			getHexValue,
			getDecimalValue,
			convertToHexString,
			getStringValue,
			addMemDump,
			addDescription,
			addChart,
			getData,
			createSeries
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
			} break;
		case 'setParser':
			{
				// Store in global variable
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
