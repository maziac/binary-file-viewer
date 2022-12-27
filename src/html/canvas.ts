import {lastNode} from "./showcharts";


/**
 * Creates a canvas object inside a table row.
 * It returns a context that can be used for drawing.
 * @param width The physical width in pixel.
 * @param height The physical height in pixel.
 * @param name (Optional) A name to show above the canvas.
 * @returns The rendering context for the canvas.
 */
export function addCanvas(width: number, height: number, name: string = ''): CanvasRenderingContext2D {
	// Check parameters
	if (width == undefined)
		throw new Error("addCanvas: Expecting a 'width' parameter.");
	if (height == undefined)
		throw new Error("addCanvas: Expecting a 'height' parameter.");
	if (typeof height != 'number')
		throw new Error("addCanvas: 'height' is not a number.");
	if (typeof name != 'string')
		throw new Error("addCanvas: 'name' is not a string.");

	// Create new row
	const node = document.createElement("TR") as HTMLTableRowElement;
	lastNode.appendChild(node);
	node.innerHTML = '<td colspan="100"></td>';
	const tdNode = node.cells[0];

	// DIV to add the title
	const div = document.createElement('div');
	tdNode.appendChild(div);
	div.innerHTML = name;

	// Add the canvas
	const canvas = document.createElement('canvas'); // as HTMLCanvasElement;
	canvas.style.width = '100%';
	//canvas.style.height = height + '';
	canvas.width = width;
	canvas.height = height;
	tdNode.appendChild(canvas);

	// Return
	const ctx = canvas.getContext('2d');
	return ctx;
}
