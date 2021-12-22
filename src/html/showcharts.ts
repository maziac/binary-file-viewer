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
 * Default colors used.
 */
const defaultColors = [
	'darkgreen',
	'cornflowerblue',
	'yellow',
	'crimson',
	'chocolate',
	'dimgray',
	'darkorange'
];


/**
 * Sub-structure passed to createChartNode.
 */
interface Series {
	samples: number[],
	label: string,
	color: string
}

/**
 * Structure passed to createChartNode.
 */
interface ChartConfig {
	// The chart type:
	type: 'line' | 'bar';
	// The data series.
	series: (Series|number[])[]
}


/**
 * Creates a node and appends it to lastNode.
 * @param name The name of the value. E.g. "SP".
 * @param valString The value to show.
 * @param shortDescription A short description of the entry.
 */
function createChartNode(config: ChartConfig, name: string, valString = '', shortDescription = ''): HTMLDetailsElement {
	// Check the config
	const cfg = {...config};
	if (cfg.type == undefined)
		cfg.type = 'line';
	if (cfg.type != 'line' && cfg.type != 'bar')
		throw new Error("createChartNode: Expecting type 'line' or 'bar', not '"+cfg.type+"'");
	if (cfg.series == undefined)
		throw new Error("createChartNode: No 'series' defined");

	// Get the max length data series
	let maxLength = 0;
	for (const series of cfg.series) {
		let samples = (series as Series).samples;
		if (!samples)
			samples = series as number[];
		if (samples.length > maxLength)
			maxLength = samples.length;
	}

	const node = createNode(name, valString, shortDescription);
	// Add details marker
	node.classList.remove("nomarker");

	// Get the data
	// 0..N-1
	const xValues = [...Array(maxLength).keys()];

	// Create the datasets.
	let legendDisplay = false;
	const datasets = [];
	let colIndex = 0;
	for (const series of cfg.series) {
		// Check series type
		let samples = (series as Series).samples;
		if (!samples)
			samples = series as number[];
		// Check defaults
		const label = (series as Series).label;
		if(label)
			legendDisplay = true;
		let color = (series as Series).color;
		if (!color) {
			// Use default color
			color = defaultColors[colIndex++];
			if (colIndex >= defaultColors.length)
				colIndex = 0;
		}
		// Store
		datasets.push({
			label: label,
			backgroundColor: color,	// point color/bar color
			borderColor: color,	// line color
			borderWidth: 1,	// line width
			pointRadius: 1,
			pointHoverRadius: 10,
			data: samples
		});
	}

	// Add chart:
	// Add a canvas
	const canvas = document.createElement('canvas'); // as HTMLCanvasElement;
	lastContentNode.append(canvas);

	// Add the chart to it
	const chartCfg = {
		type: cfg.type,
		data: {
			labels: xValues,
			datasets
		},
		options: {
			plugins: {
				legend: {
					display: legendDisplay	// Display a labels?
				}
			}
		}
	};
	new Chart(canvas, chartCfg);	// NOSONAR


	// Return
	return node;
}


/**
 * Creates a series from a number array.
 * Adds a label and a color.
 * @param samples The data number array.
 * @param color Optional. The color to use.
 * @param label Optional. A string to mark the series.
 */
function createSeries(samples: number[], color?: string, label?: string): Series {
	return {samples, label, color};
}

