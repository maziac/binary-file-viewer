import {lastNode} from "./showcharts";

/**
 * Creates a text box object inside a table row.
 * The text inside the box is not editable but vertically scrollable if too big.
 * The text is wrapped.
 * The box uses the available width.
 * @param text The text to display inside the text box.
 * @param minHeight The minimum height of the text box in pixels.
 * @param initialMaxHeight The initial (maximum) height of the text box in pixels.
 * If the text does not fill the complete height, the height is adjusted to fit the
 * content. But will stay > minHeight.
 * @returns The text box element.
 */
export function addTextBox(text: string, minHeight: number, initialMaxHeight: number): HTMLDivElement {	// TODO: add to documentation
	// Check parameters
	if (typeof text !== 'string')
		throw new Error("addTextBox: 'text' is not a string.");
	if (minHeight === undefined)
		minHeight = 100;
	if (typeof minHeight !== 'number')
		throw new Error("addTextBox: 'minHeight' is not a number.");
	if (initialMaxHeight === undefined)
		initialMaxHeight = 300;
	if (typeof initialMaxHeight !== 'number')
		throw new Error("addTextBox: 'initialMaxHeight' is not a number.");

	// Create new row
	const node = document.createElement("TR") as HTMLTableRowElement;
	lastNode.appendChild(node);
	node.innerHTML = '<td colspan="100"></td>';
	const tdNode = node.cells[0];

	// Create the text box
	const textBox = document.createElement('div');
	textBox.style.width = '100%';
	textBox.style.minHeight = `${minHeight}px`;
	textBox.style.height = `${initialMaxHeight}px`;
	textBox.style.overflowY = 'auto';
	textBox.style.whiteSpace = 'pre-wrap';
	textBox.style.overflowWrap = 'break-word';
	textBox.style.border = '1px solid black';
	textBox.style.padding = '5px';
	textBox.style.boxSizing = 'border-box';
	textBox.style.resize = 'vertical'; // Allow vertical resizing
	textBox.innerText = text;
	textBox.contentEditable = 'false';

	// Append the text box to the table cell
	tdNode.appendChild(textBox);

	// Adjust the height to fit the content if it does not fill the complete height
	const adjustHeight = () => {
		textBox.style.height = 'auto'; // Temporarily set height to auto to get the content height
		const contentHeight = textBox.scrollHeight;
		textBox.style.height = `${Math.min(contentHeight, initialMaxHeight)}px`; // Set the height to the content height or max height
	};

	// Call adjustHeight after the text box is appended to the DOM
	setTimeout(adjustHeight, 0);

	// Return the text box element
	return textBox;
}
