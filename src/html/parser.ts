import {vscode} from './vscode-import';
import {dataBuffer, lastOffset, lastSize, lastBitOffset, lastBitSize, startOffset, getDataBufferSize, getRelOffset, convertToHexString, correctBitByteOffsets, setLastOffset, setLastSize, setLastBitOffset, setLastBitSize, setStartOffset, setLittleEndian, read, readUntil, setOffset, getOffset, readBits, setEndianness, getNumberValue, getSignedNumberValue, getFloatNumberValue, getBitsValue, getHexValue, getHex0xValue, getDecimalValue, getSignedDecimalValue, getStringValue, getData, endOfFile, getRemainingSize, setDataBuffer} from './dataread';
import {lastNode, setLastNode, addChart, createSeries} from './showcharts';
import {addCanvas} from './canvas';
import {addTextBox} from './textbox';

/**
 * This js script parses a file, does all the decoding and presents the
 * data in the webview.
 * It is done as script inside the webview (opposed to creating a html file in
 * the extension) to allow lazy loading.
 * Large blocks of data are skipped in the initial pass and decoded only
 * when needed. I.e. when the user expands an item.
 */



// The custom parser (js program as a string).
let customParser: string;

// The file path of the custom parser.
let filePathParser: string;

// Contains the file path of the binary file to parse.
let binFilePath: string;

// The current row's cell that contains the collapsible icon (+)
let lastCollapsibleNode: HTMLTableCellElement;

// The current row's cell that contains the value. Can be used to
// add a value later.
let lastValueNode: HTMLTableCellElement;

// The node used for the standard header.
let standardHeaderNode: HTMLDivElement;

// Overrides the open/closed state for the details.
// Used for debugging.
let overrideDetailsOpen: boolean | undefined;


/**
 * Used internally while creating rows.
 */
interface RowNodes {
	offsetNode: HTMLTableCellElement,
	sizeNode: HTMLTableCellElement,
	valueNode: HTMLTableCellElement,
	descriptionNode: HTMLTableCellElement
}

// The context menu objects
const contextMenu = document.getElementById('context-menu') as HTMLDivElement;
const contextMenuItemCopy = document.getElementById('context-menu-item-copy') as HTMLDivElement;
const contextMenuItemSaveAs = document.getElementById('context-menu-item-saveas') as HTMLDivElement;


// /**
//  * Call to check a value.
//  * Does nothing.
//  * You can set a breakpoint here.
//  */
// function assert(condition: boolean) {
// 	if (!condition) {
// 		console.error('Error!');
// 	}
// }


/**
 * Sends a command to the extension to open or focus the used parser file.
 */
globalThis.openCustomParser = function () {
	vscode.postMessage({
		command: 'openCustomParser'
	});
}


/**
 * Sends a command to the extension to reload and re-parse the file.
 */
globalThis.reloadFile = function () {
	vscode.postMessage({
		command: 'reload'
	});
}


/**
 * Adds a standard header, i.e. the size of the file.
 */
function addStandardHeader() {
	// Calculate human readable file size
	const fileSize = getDataBufferSize();
	let humanString = '';
	let humanFileSize = fileSize;
	const sizes = ['K', 'M', 'G'];
	let h = -1;
	while (humanFileSize > 2000) {
		if (h >= sizes.length - 1)
			break;
		humanFileSize /= 1000;
		h++;
	}
	if (h >= 0) {
		humanFileSize = Math.round(humanFileSize);
		humanString = ' (' + humanFileSize.toString() + sizes[h] + 'B)';
	}

	// Add file size
	let html = '<span>File size: ' + fileSize + ' Bytes' + humanString + ', </span>';

	// Used parser
	let i = filePathParser.lastIndexOf('/');
	const k = filePathParser.lastIndexOf('\\');
	if (k > i)
		i = k;
	i++;
	const usedParser = filePathParser.substring(i);
	html += '<span>Parser used: <a href="#" onclick="openCustomParser()">' + usedParser + '</a></span>';

	standardHeaderNode.innerHTML = html;
}


/**
 * When the cell with the offset is clicked the webview sends a
 * command to the webview, so that it displays the corresponding line
 * in the custom parser js file.
 */
globalThis.linkToCustomParserLine = function (cell: HTMLTableCellElement) {
	const offset = (cell as any)['_customParserOffset'];
	if (offset) {
		vscode.postMessage({
			command: 'selectLine',
			offset
		});
	}
}


/**
 * Sets the value of the current cell.
 * Normally you can set the value directly in 'addRow' or 'readRowWithDetails'.
 * This command can be used for special cases where the value is not known at the time the both functions are called.
 * @param value The value to set.
 * @param valueHover (Optional) Is displayed on hovering over the 'value'.
 */
function setRowValue(value: String | string | number, valueHover?: string | number) {	// NOSONAR
	// Set value
	if (lastValueNode)
		lastValueNode.innerHTML = '' + value;
	// Add hover text if available
	let hoverValue = valueHover;
	if (hoverValue == undefined)
		hoverValue = (value as any).hoverValue;
	if (hoverValue != undefined) {
		lastValueNode.title = '' + hoverValue;
	}
}


/**
 * Adds an (almost) empty row. Value and size have to be added later.
 * This is a function used by addRow and readRowWithDetails.
 * @param name The name of the value (the row).
 * @returns The created cells.
 */
function addEmptyRow(name: string): RowNodes {
	// Create new node
	const node = document.createElement("TR") as HTMLTableRowElement;
	const relOffset = getRelOffset();
	const relOffsetHex = convertToHexString(relOffset, 4);
	const prefix = (startOffset) ? '+' : '';	// '+' for relative index
	let hoverOffset = `Offset:\nHex: ${relOffsetHex}`;
	if (startOffset) {
		// Is a relative index, so show also the absolute index as hover.
		const lastOffsetHex = convertToHexString(lastOffset, 4);
		hoverOffset += `\nAbsolute:\nDec: ${lastOffset}, Hex: ${lastOffsetHex}`;
	}

	const html = `
	<td class="collapse"></td>
	<td class="offset" title="${hoverOffset}">${prefix}${relOffset}</td>
	<td class="size"></td>
	<td class="name">${name}</td>
	<td class="value"></td>
	<td class="description"></td>
`;
	node.innerHTML = html;

	// Append it / Insert new row
	lastNode.appendChild(node);

	// Get child objects
	const cells = node.cells;

	// Remember
	lastCollapsibleNode = cells[0]; // HTMLTableCellElement;
	lastValueNode = cells[4]; // HTMLTableCellElement;

	// return
	return {
		offsetNode: cells[1], // HTMLTableCellElement,
		sizeNode: cells[2], // HTMLTableCellElement,
		valueNode: cells[4], // HTMLTableCellElement,
		descriptionNode: cells[5] // HTMLTableCellElement,
	}
}


/**
 * Completes the row with data.
 * This is a function used by addRow and readRowWithDetails.
 * @param value (Optional) The value to display.
 * @param description (Optional) A short description of the entry.
 * @param valueHover (Optional) Is displayed on hovering over the 'value'.
 */
function makeRowComplete(row: RowNodes, value: String | string | number = '', description = '', valueHover?: string | number) {	// NOSONAR
	// Short description
	row.descriptionNode.innerHTML = description;
	// Get bit range (displayed e.g. as "+5:7-3" with 7-3 being the bit range) or use size in bytes
	let lastSizeHex;
	let sizeString = '';
	if (lastSize >= 0) {
		// Bytes used
		sizeString = lastSize.toString();
		if(lastBitSize > 0)
			lastSizeHex = 'Hex: ' + convertToHexString(lastSize, 4);
	}
	if(lastBitSize > 0) {
		// Yes, bits used
		if (lastBitSize == 1) {
			// Special case: only one bit
			sizeString += '.' + lastBitOffset;
		}
		else {
			// A range
			sizeString += '.' + (lastBitOffset + lastBitSize - 1) + '-' + lastBitOffset;
		}
	}
	row.sizeNode.innerHTML = sizeString;
	if(lastSizeHex)
		row.sizeNode.title = lastSizeHex;

	// Add value
	row.valueNode.innerHTML = '' + value;

	// Add hover text if available
	let hoverValue = valueHover;
	if (hoverValue == undefined)
		hoverValue = (value as any).hoverValue;
	if (hoverValue != undefined) {
		row.valueNode.title = '' + hoverValue;
	}

	// Get stack trace for link to custom parser file.
	// Note: takes about 0.009 ms
	//console.time();
	const errFileLocation = new Error();
	//console.timeEnd();
	// Parse the stack trace
	const stack = errFileLocation.stack!.split('\n');
	const customLine: string = stack[3];
	const match = /.*>:(\d+):(\d+)/.exec(customLine);
	if (match) {
		// Line
		const lineNr = parseInt(match[1]) - 4;
		// Column
		const colNr = parseInt(match[2]) - 1;
		// Create link: If the offset is clicked the line in the user's js file is selected.
		(row.offsetNode as any)['_customParserOffset'] = {
			lineNr,
			colNr
		};
		row.offsetNode.setAttribute('onclick', 'linkToCustomParserLine(this)');
	}
}


/**
 * Creates a new row for the table.
 * @param name The name of the value.
 * @param value (Optional) The value to display.
 * @param description (Optional) A short description of the entry.
 * @param valueHover (Optional) Is displayed on hovering over the 'value'.
 */
function addRow(name: string, value: String | string | number = '', description = '', valueHover?: string | number) { // NOSONAR
	const row = addEmptyRow(name);
	makeRowComplete(row, value, description, valueHover);
}


/**
 * Reads (data) and creates a new row for the table.
 * The details are always parsed immediately.
 * @param name The name of the value.
 * @param opened true=the details are opened on initial parsing.
 * false (default)=The details are initially closed.
 */
function readRowWithDetails(name: string, func: () => {value: String | string | number, description: string, valueHover: string | number}, opened = false) {	// NOSONAR
	// Check if overridden
	if (overrideDetailsOpen != undefined) {
		opened = overrideDetailsOpen;
	}

	// Correct the offset to be after lastSize
	correctBitByteOffsets();

	// Add row
	const row = addEmptyRow(name);

	// Save
	const beginOffset = lastOffset;
	const bakStartOffset = startOffset;

	// "Indent"
	beginDetails(opened);
	// Add details immediately
	setLastSize(0);
	setLastBitSize(0);
	setStartOffset(lastOffset);
	const result = func();
	// Unindent
	endDetails();

	// Calculate size from what has been used in details
	const endOffset = lastOffset + lastSize;
	setLastSize(endOffset - beginOffset);
	setLastOffset(beginOffset);
	setLastBitSize(lastBitSize + lastBitOffset);
	setLastSize(lastSize + Math.floor(lastBitSize / 8));
	setLastBitSize(lastBitSize % 8);
	setLastBitOffset(0);

	// Restore
	setStartOffset(bakStartOffset);
	lastValueNode = row.valueNode;

	// Set size etc
	if (result)
		makeRowComplete(row, result.value, result.description, result.valueHover);
	else
		makeRowComplete(row);
}


/**
 * Converts \n into <br>.
 */
function convertLineBreaks(s: string) {
	return s.replace(/\n/g, '<br>');
}


/**
 * Is called by 'onclick'.
 * Collapses and expands all rows in '_expandRows'.
 */
function collapse(cell: HTMLTableCellElement) {
	const expandRows = (cell as any)['_expandRows'] as HTMLTableRowElement[];
	for (const targetRow of expandRows) {
		if (targetRow.style.display == 'table-row') {
			cell.innerHTML = '+';
			targetRow.style.display = 'none';
		}
		else {
			cell.innerHTML = '-';
			targetRow.style.display = 'table-row';
			const event = new CustomEvent('expand');
			cell.dispatchEvent(event);
		}
	}
}


/**
 * Adds a collapsible icon (+) and function to the current row.
 * This begins a details sections.
 * @param opened true=the details are directly shown, false=the details are initially hidden.
 */
function beginDetails(opened: boolean) {
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

	// Check if there is a row to expand
	if (lastCollapsibleNode) {
		// Add collapsible icon (+)
		lastCollapsibleNode.innerHTML = (opened) ? '-' : '+';
		// Add function
		lastCollapsibleNode.onclick = (event) => {
			collapse(event.target as HTMLTableCellElement);
		};

		// Get/Set row(s) to open
		let expandRows = (lastCollapsibleNode as any)['_expandRows'] as HTMLTableRowElement[];
		if (!expandRows) {
			expandRows = [];
			(lastCollapsibleNode as any)['_expandRows'] = expandRows;
		}
		expandRows.push(row);
	}

	// Use new table
	setLastNode(detailsTable);

	// Return
	return detailsTable;
}


/**
 * Ends a details sections.
 * Sets lastNode to it's parent.
 */
function endDetails() {
	setLastNode(lastNode.parentNode.parentNode.parentNode);
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
	// Check if overridden
	if (overrideDetailsOpen != undefined) {
		opened = overrideDetailsOpen;
	}

	// "Indent"
	beginDetails(opened);

	// Backup values
	const bakLastOffset = lastOffset;
	const bakLastSize = lastSize;
	const bakLastBitOffset = lastBitOffset;
	const bakLastBitSize = lastBitSize;
	const bakStartOffset = startOffset;
	const bakLastNode = lastNode;
	const bakLastValueNode = lastValueNode;
	const bakLastCollapsibleNode = lastCollapsibleNode;

	// Delayed or not
	if (opened) {
		// Call function immediately
		setLastSize(0);
		setLastBitSize(0);
		setStartOffset(lastOffset);
		func();
	}
	else {
		// Open/parse delayed
		lastCollapsibleNode.addEventListener("expand", function handler(this: any, event: any) {
			this.removeEventListener("expand", handler);
			// Get parse node and index
			//lastNode = event.target;
			setLastOffset(bakLastOffset);
			setStartOffset(lastOffset);
			setLastSize(0);
			setLastBitSize(0);
			setLastBitOffset(0);
			setLastNode(bakLastNode);
			lastCollapsibleNode = undefined as any;
			try {
				func();
			}
			catch (e) {
				// Return error
				vscode.postMessage({
					command: 'customParserError',
					stack: e.stack
				});
			}
		});
	}

	// Restore values
	setLastOffset(bakLastOffset);
	setLastSize(bakLastSize);
	setLastBitOffset(bakLastBitOffset);
	setLastBitSize(bakLastBitSize);
	setStartOffset(bakStartOffset);
	lastCollapsibleNode = bakLastCollapsibleNode;
	lastValueNode = bakLastValueNode;

	// Close/leave
	endDetails();
}


/**
 * Creates a description line of contents.
 * Is gray.
 * @param descr The description string. Any linebreaks are converted into '<br>'.
 */
globalThis.createDescription = function (descr: string) {
	// Create new node
	const node = document.createElement("DIV");
	// Add description
	node.innerHTML = convertLineBreaks(descr);
	// Append it
	lastNode.appendChild(node);
}


/**
 * Adds a memory dump (hex and ASCII) for the data from the dataBuffer.
 */
function addMemDump() {
	let html = '';
	let asciiHtml = '';
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
					<td class="size" title="Size:\nDec: ${LINECOUNT}Hex: ${lineCountHex}">${LINECOUNT}</td>
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
globalThis.parseStart = function () {
	// Reset
	overrideDetailsOpen = undefined;
	setLittleEndian(true);
	setLastOffset(0);
	setStartOffset(lastOffset);
	setLastSize(0);
	setLastBitOffset(0);
	setLastBitSize(0);
	setLastNode(document.getElementById("div_root"));
	lastNode.innerHTML = '';	// Remove any previous data

	// Create table with header row
	lastNode.innerHTML = `
	<div>
		<span></span>
		<span></span>
	</div>
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
	const startNode = lastNode.children[0];
	// For the standard header
	standardHeaderNode = startNode.children[0];
	// The reload button
	const reloadNode = startNode.children[1];
	reloadNode.innerHTML = '<button onclick="reloadFile()">Reload</button>';
	// Use table
	setLastNode(lastNode.children[1]);

	try {
		// Get parser and execute
		scopeLessFunctionCall(customParser, {
			registerFileType: (func: (fileExt: string, filePath: string, data: any) => boolean) => {
				// Does nothing here.
			},
			registerParser: (func: (filePath: string) => void) => {
				// Once the function registers it can be executed.
				// I.e. custom parsing is started:
				func(binFilePath);
			},

			// API
			addStandardHeader,
			read,
			readUntil,
			readBits,
			readRowWithDetails,
			setOffset,
			getOffset,
			setEndianness,
			addRow,
			addDetails,
			getNumberValue,
			getSignedNumberValue,
			getFloatNumberValue,
			getBitsValue,
			getHexValue,
			getHex0xValue,
			getDecimalValue,
			getSignedDecimalValue,
			convertToHexString,
			getStringValue,
			setRowValue,
			addMemDump,
			addChart,
			getData,
			createSeries,
			addCanvas,
			addTextBox,
			dbgStop,
			dbgLog,
			dbgOverrideDetailsOpen,
			endOfFile,
			getRemainingSize,

			// Standard
			Math,
			String,
			Number,
			Object,
			Array,
			Map,
			JSON,

			// atob, btoa
			atob: (s) => {return atob(s);},	// For some reason I cannot directly declare those.
			btoa: (s) => {return btoa(s);}
		});
	}
	catch (e) {
		// Return error
		vscode.postMessage({
			command: 'customParserError',
			stack: e.stack
		});
	}
}


/**
 * Copies the complete html of the document to the clipboard.
 */
globalThis.copyHtmlToClipboard = function () {
	const copyText = document.documentElement.innerHTML;
	navigator.clipboard.writeText(copyText);
}


/** Checks for right click to display the context menu.
*/
document.addEventListener('contextmenu', function (event) {	// NOSONAR
	if (!event)
		return;
	event.preventDefault();

	// Ensure the webview has focus
	if (!document.hasFocus())
		return;

	// Remember the target element for the context menu
	contextMenuTarget = event.target as HTMLElement;

	// Make menu visible and position it
	makeMenuVisibleAt(contextMenu, event.clientX, event.clientY);
});
let contextMenuTarget: HTMLElement | null = null;


/** Hide context menu. */
document.addEventListener('click', function (event) {
	if (event.target !== contextMenu && !contextMenu.contains(event.target as Node)) {
		contextMenu.classList.remove('visible');
	}
});


// Make menu visible and position it at mouesX/Y.
// It also moves the rect in the visible area.
function makeMenuVisibleAt(contextMenu: HTMLDivElement, mouseX, mouseY) {
	// Check for out of bounds and display
	contextMenu.classList.add("visible");
	const {normalizedX, normalizedY} = normalizePosition(mouseX, mouseY, contextMenu);
	contextMenu.style.left = `${normalizedX}px`;
	contextMenu.style.top = `${normalizedY}px`;
}


/** Prevent selection loss on context menu click. */
contextMenu.addEventListener('mousedown', function (event) {
	event.preventDefault();
});


/** Menu item "Copy" has been clicked. */
contextMenuItemCopy.addEventListener('click', async function () {
	// Get data
	const data = await getCopyData();
	if (!data)
		return;

	// Put on clipboard depending on data type
	if (typeof data === 'string') {
		await navigator.clipboard.writeText(data);
	}
	else if (data instanceof Blob) {
		const item = new ClipboardItem({'image/png': data});
		navigator.clipboard.write([item]).then(() => {
			console.log('Image copied to clipboard');
		}).catch(err => {
			console.error('Failed to copy image: ' + err);
		});
	}

	contextMenu.classList.remove('visible');
});


/** Menu item "Save as" has been clicked. */
contextMenuItemSaveAs.addEventListener('click', async function () {
	// Get data
	let data = await getCopyData();
	if (!data)
		return;

	if (data instanceof Blob) {
		// Save image
		data = await data.arrayBuffer();
	}

	// Post message to vscode
	vscode.postMessage({
		command: 'saveas',
		data
	});

	contextMenu.classList.remove('visible');
});


/** Copies the selected text, or the wwhole text if nothing selected
 * any selected canvas as image.
 * @returns The copied data. string | Blob | null
 */
async function getCopyData() {
	let data;
	const selection = window.getSelection();

	if (contextMenuTarget && contextMenuTarget.tagName === 'CANVAS') {
		// Canvas/image copy
		const canvas = contextMenuTarget as HTMLCanvasElement;
		const dataUrl = canvas.toDataURL('image/png');
		data = await(await fetch(dataUrl)).blob();
	}
	else {
		// Text copy
		if (selection && selection.rangeCount > 0) {
			// Just the selected text
			const range = selection.getRangeAt(0);
			data = range.toString();
		}
		if (!data) {
			// The complete text
			data = contextMenuTarget?.innerText || '';
		}
	}
	return data;
}


/**
 * The function checks if the mouse position gets outside the 'body'.
 * @param mouseX mouse x position
 * @param mouseY mouse y position
 * @param contextMenu The context menu.
 * @returns mouse x/y inside the body.
 */
function normalizePosition(mouseX: number, mouseY: number, contextMenu: HTMLElement) {
	const width = document.documentElement.clientWidth;
	const height = document.documentElement.clientHeight;

	const ctxMenuRect = contextMenu.getBoundingClientRect();

	let normalizedX = mouseX;
	let normalizedY = mouseY;

	// normalize on X
	if (normalizedX + ctxMenuRect.width > width) {
		normalizedX = width - ctxMenuRect.width;
	}
	// normalize on Y
	if (normalizedY + ctxMenuRect.height > height) {
		normalizedY = height - ctxMenuRect.height;
	}

	return {normalizedX, normalizedY};
}


//---- Handle messages from vscode extension --------
window.addEventListener('message', event => {	// NOSONAR
	const message = event.data;
	switch (message.command) {
		case 'setData':
			// Store in global variable
			setDataBuffer(message.data);
			break;
		case 'setParser':
			// Store in global variable
			customParser = message.parser.contents;
			filePathParser = message.parser.filePath;
			binFilePath = message.binFilePath;

			// Parse
			globalThis.parseStart();
			break;
	}
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


/**
 * Stops the execution of the parser with an exception.
 * Used for debugging the parser script.
 */
function dbgStop() {
	const e = Error("dbgStop: Script stopped.");
	if (e.stack) {
		// Remove the "Error: " from the message string.
		const msg = e.stack.replace(/^Error: /, '');
		e.stack = msg;
	}
	throw e;
}



/**
 * Redirects console output to the extension to print it.
 */
function dbgLog() {
	// Convert arguments to string
	let argsString = '';
	for (const arg of arguments) {
		argsString += '\t' + arg;
	}
	// Print log into OUTPUT pane
	vscode.postMessage({
		command: 'dbgLog',
		arguments: argsString
	});
}


/**
 * Overrides the open/closed state of following 'details' commands.
 * Can be used for debugging purposes to e.g. temporary open all
 * 'details' during parsing. Removing the need to manually open the
 * 'details' on each change in the parser js file.
 * @param open Is a boolean:
 * true: All following 'details' commands will be initially open. Regardless of the individual setting.
 * false: All following 'details' commands will be initially closed. Regardless of the individual setting.
 * undefined: Switch back to normal behavior. The individual setting will be used.
 */
function dbgOverrideDetailsOpen(open: boolean | undefined) {
	overrideDetailsOpen = open;
}



//----------------------------------------------------------

// At the end send a message to indicate that the webview is ready to receive
// data.
vscode.postMessage({
	command: 'ready'
});
