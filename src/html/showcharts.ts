//declare function getHexString(value: number, size: number): string;
declare var lastOffset: any;
declare var lastSize: any;
declare var lastContentNode: any;
declare var lastNameNode: any;
declare var lastValueNode: any;
declare var lastDescriptionNode: any;
declare var lastLongDescriptionNode: any;
declare var lastNode: any;
declare var dataBuffer: Uint8Array;
declare var getHexString: any;
declare var createNode: any;
declare var Chart: any;


/**
 * Creates a node and appends it to lastNode.
 * @param name The name of the value. E.g. "SP".
 * @param valString The value to show.
 * @param shortDescription A short description of the entry.
 */
function createChartNode(config: any, name: string, valString = '', shortDescription = ''): HTMLDetailsElement {
	const node = createNode(name, valString, shortDescription);
	// Add details marker
	node.classList.remove("nomarker");

	// Get the data
	// 0..N-1
	const xValues = [...Array(lastSize).keys()];
	// y-values
	const yValues = [];
	const end = lastOffset + lastSize;
	for (let i = lastOffset; i < end; i++) {
		yValues.push(dataBuffer[i]);
	}

	// Add chart:
	// Add a canvas
	const canvas = document.createElement('canvas'); // as HTMLCanvasElement;
	lastContentNode.append(canvas);

	// Add the chart to it
	const config2 = {
		type: 'line',
		data: {
			labels: xValues,
			datasets: [{
				backgroundColor: 'rgb(255, 99, 132)',
				borderColor: 'rgb(255, 99, 132)',
				data: yValues,
			}]
		}
	};
	const chart = new Chart(canvas, config2);


	// Return
	return node;
}

