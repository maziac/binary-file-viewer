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
	series: Series[]
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
		if (series.samples.length > maxLength)
			maxLength = series.samples.length;
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
	for (const series of cfg.series) {
		if (series.label)
			legendDisplay = true;
		datasets.push({
			label: series.label,
			backgroundColor: series.color,	// point color/bar color
			borderColor: series.color,	// line color
			borderWidth: 1,	// line width
			pointRadius: 1,
			pointHoverRadius: 10,
			data: series.samples
		});
	}

	// Add chart:
	// Add a canvas
	const canvas = document.createElement('canvas'); // as HTMLCanvasElement;
	lastContentNode.append(canvas);

	// Add the chart to it
	const chartCfg = {
		type: 'line',
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

