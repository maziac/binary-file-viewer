declare var lastOffset: number;
declare var lastSize: number;
declare var lastContentNode: any;
//declare var lastValueNode: any;
declare var lastLongDescriptionNode: any;
declare var lastNode: any;
declare var dataBuffer: Uint8Array;
declare var createNode: any;
declare var Chart: any;




/**
 * Default colors used.
 */
const defaultColors = [
	'yellow',
	'darkgreen',
	'cornflowerblue',
	'red',
	'crimson',
	'chocolate',
	'dimgray',
	'darkorange'
];


/**
 * Sub-structure passed to addChart.
 */
interface Series {
	samples: number[],
	label?: string,
	color?: string
}

/**
 * Structure passed to addChart.
 */
interface ChartConfig {
	// The chart type:
	type?: 'line' | 'bar';
	// The data series.
	series: (Series|number[])[]
}


/**
 * Called to reset the zoom via the chartjs-plugin-zoom.
 * @param button The button that was clicked. HAs a link to the chart.
 */
function resetZoom(button: HTMLButtonElement) {
	const chart = (button as any)._chart;
	chart.resetZoom();
}


/**
 * Creates a chart. E.g. a line chart or a bar chart.
 * Use this to visualize series data.
 * @param config The chart configuration:
 * type: 'line' | 'bar'
 * series: An array which contains either number arrays (obtained by 'getData')
 * or 'Series' structures if you need more control.
 * A Series structure contains:
 * samples: The data number array.
 * label: A name for the data series.
 * color: The color of the data series, e.g. 'green'.
 * @param name (Optional) The name of the chart.
 */
function addChart(config: ChartConfig, name?: string) {
	// Check parameters
	if (config == undefined)
		throw new Error("addChart: Expecting a 'config' parameter.");
	// Check the config
	const cfg = {...config};
	if (cfg.type == undefined)
		cfg.type = 'line';
	if (cfg.type != 'line' && cfg.type != 'bar')
		throw new Error("addChart: Expecting type 'line' or 'bar', not '" + cfg.type + "'.");
	// Check series
	if (cfg.series == undefined)
		throw new Error("addChart: No 'series' defined.");
	if (!Array.isArray(cfg.series))
		throw new Error("addChart: 'series' is not an array.");
	if (cfg.series.length == 0)
		throw new Error("addChart: 'series' is empty.");

	// Get the max length data series and
	// check each item in series
	let maxLength = 0;
	for (const series of cfg.series) {
		let samples = (series as Series).samples;
		if (!samples) {
			// Check if number array
			if (!Array.isArray(series))
				throw new Error("addChart: 'series' contains not a 'Series' type item nor a number array.");
			samples = series; // as number[];
		}
		if (samples.length > maxLength)
			maxLength = samples.length;
	}

	// Create new row
	const node = document.createElement("TR") as HTMLTableRowElement;
	lastNode.appendChild(node);
	node.innerHTML = '<td colspan="100"></td>';
	const tdNode = node.cells[0];

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

	// DIV to add some text
	const div = document.createElement('div');
	tdNode.appendChild(div);
	div.innerHTML = `
	<span>pan=ALT-mouse, zoom=mouse</span>
	<button style="float: right;" onclick="resetZoom(this)">Reset Pan/Zoom</button>
	`;
	const button = div.lastElementChild as HTMLButtonElement;
	// Add canvas for chart
	const canvas = document.createElement('canvas'); // as HTMLCanvasElement;

	// Canvas container. Is required for proper re-sizing. Without re-sizing to smaller sizes would not work.
	// See https://www.chartjs.org/docs/3.5.0/configuration/responsive.html#important-note
	const canvasContainer = document.createElement('div');
	canvasContainer.style.position = 'relative';
	canvasContainer.style.width = '91vw';	// 91% of the view port. Higher values move the button for whatever reason.
	canvasContainer.appendChild(canvas);
	tdNode.appendChild(canvasContainer);

	// Add the chart to it
	const chartCfg = {
		type: cfg.type,
		data: {
			labels: xValues,
			datasets
		},
		options: {
			plugins: {
				title: {
					display: true,
					text: name
				},
				legend: {
					display: legendDisplay	// Display a labels?
				},
				zoom: {
					pan: {
						enabled: true,
						modifierKey: 'alt'
					},
					zoom: {
						drag: {
							enabled: true,
						},
						mode: 'xy',
					}
				}
			}
		}
	};
	const chart = new Chart(canvas, chartCfg);	// NOSONAR
	(button as any)._chart = chart;
}


/**
 * Creates a series from a number array.
 * Adds a label and a color.
 * @param samples The data number array.
 * @param color Optional. The color to use.
 * @param label Optional. A string to mark the series.
 * @returns A Series object with samples, label and color info.
 */
function createSeries(samples: number[], color?: string, label?: string): Series {
	return {samples, label, color};
}

