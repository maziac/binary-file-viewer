import {lastNode} from "./showcharts";

/**
 * Creates a text box object inside a table row.
 * The text inside the box is not editable but vertically scrollable if too big.
 * The text is wrapped.
 * The box uses the available width.
 * @param width The physical width in pixels.
 * @param text The text to display inside the text box.
 * @returns The text box element.
 */
export function addTextBox(height: number, text: string): HTMLDivElement {	// TODO: add to documentation
	// Check parameters
	if (height == undefined)
		throw new Error("addTextBox: Expecting a 'height' parameter.");
	if (typeof height != 'number')
		throw new Error("addTextBox: 'height' is not a number.");
	if (typeof text != 'string')
		throw new Error("addTextBox: 'text' is not a string.");

	// Create new row
	const node = document.createElement("TR") as HTMLTableRowElement;
	lastNode.appendChild(node);
	node.innerHTML = '<td colspan="100"></td>';
	const tdNode = node.cells[0];

	// Create the text box
	const textBox = document.createElement('div');
	textBox.style.width = '100%';
	textBox.style.height = `${height}px`;
	textBox.style.overflowY = 'auto';
	textBox.style.whiteSpace = 'pre-wrap';
	textBox.style.overflowWrap = 'break-word';
	textBox.style.border = '1px solid black';
	textBox.style.padding = '5px';
	textBox.style.boxSizing = 'border-box';
	textBox.innerText = text;
	textBox.contentEditable = 'false';

	// Append the text box to the table cell
	tdNode.appendChild(textBox);

	// Return the text box element
	return textBox;
}
