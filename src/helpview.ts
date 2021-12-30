import * as vscode from 'vscode';
import {readFileSync} from 'fs';
import * as path from 'path';
import {PackageInfo} from './packageinfo';
const showdown = require('showdown');	// Showdown 1.9.1 has moderate vulnerabilit dependency. need to wait on v2.0.


/**
 * A Webview that shows the help view in a window.
 */
export class HelpView {

	// String that contains the whole html of the help page (Usage.md).
	protected static helpHtml: string;

	// String that contains the complete TOC of the help html.
	protected static tocHtml: string;

	// Static pointer on singleton.
	protected static singleton: HelpView;


	/**
	 * Returns the pointer to the HelpView singleton.
	 * If not existing then one is created.
	 */
	public static getHelpView(): HelpView {
		if (!this.singleton)
			this.singleton = new HelpView();
		return this.singleton;
	}


	/**
	 * Returns the Usage.md html code with TOC.
	 * Does lazy creation. I.e. the html is created the first time
	 * this method is called.
	 * Then the string is cached.
	 * @returns Usage.md as html without the resource path substituted.
	 */
	protected static getHelpHtml() {
		if (!this.helpHtml) {
			// Load Usage.md file
			const extFolder = PackageInfo.extensionPath();
			//const usageFileName = 'documentation/Usage.md';
			const usageFileName = path.join('assets', 'help', 'help.md');
			const filePath = path.join(extFolder, usageFileName);
			const mdText = readFileSync(filePath).toString();

			// Convert md -> html
			const converter = new showdown.Converter();
			//converter.setOption('completeHTMLDocument', 'true');
			converter.setOption('simpleLineBreaks', true);
			//converter.setOption('simplifiedAutoLink', true);
			//converter.setOption('noHeaderId', false);
			converter.setOption('ghCompatibleHeaderId', true);
			converter.setOption('tables', true);
			//converter.setOption('tablesHeaderId', 'true');
			const html2 = converter.makeHtml(mdText);

			// Create headings number (CSS is not used because the numbers should occur also in the TOC)
			const tocCounter = [0, 0, 0];
			const startLevel = 2;
			const html = html2.replace(/<h(\d)(.*?)>/g, (match: any, p1: any) => {
				const level = parseInt(p1) - startLevel;
				// Check for unaffected levels
				if (level < 0 || level >= tocCounter.length)
					return match;
				// Increase counter
				tocCounter[level]++;
				// Rest counters below
				for (let i = level + 1; i < tocCounter.length; i++)
					tocCounter[i] = 0;
				// Create aggregated count
				let countString = '';
				for (let i = 0; i <= level; i++)
					countString += tocCounter[i].toString() + '.';
				return match + ' ' + countString + ' ';
			});

			// Add the html styles etc.
			const mainHtml = `
<!DOCTYPE HTML>
<html>
<head>
	<meta charset="utf-8" >
	<title>DeZog Help</title>
	<base href="\${vscodeResPath}/">
</head>

<style>
table {
    border-collapse: collapse;
}
td, th {
    border: 1px solid;
}

th {
  background: var(--vscode-merge-incomingHeaderBackground);
}

#toc {
  height: 30em;
  overflow: scroll;
  overscroll-behavior: contain; /* Prevent scroll chaining to parent */
}

#toc_main {
  position: fixed;
  right: 1em;
  top: 1em;
  padding: 0.5em;
  border-radius: 5px;
  box-shadow: 1px 1px 5px var(--vscode-editor-foreground);
  background: var(--vscode-editor-background);
}

#toc_main #toc_full { display: none; } /* Hide TOC initially */

#toc_main:hover #toc_full{
  display: block; /* Show it on hover */
}

</style>

<body>

<!-- Table of contents -->
<div id="toc_main">
	<div style="text-align:right">CONTENT</div>
	<div id="toc_full">

<!--#TOC_START-->
		<div id="toc_contents"></div>
<!--#TOC_END-->

	</div>
</div>

${html}

</body>

<script>

const vscode = acquireVsCodeApi();

//---- Handle Messages from vscode extension --------
window.addEventListener('message', event => {
		const message = event.data;

	switch (message.command) {
		case 'navigate':
		{
			// Get link to chapter
			const chapter = message.data;
			// Jump to
		    location.hash = chapter;
		}   break;
	}
});

</script>

</html>
`;

			// Add table of contents
			const posthtml = require('posthtml');
			const toc = require('posthtml-toc');

			const resHtml = posthtml()
				.use(toc({after: '#toc_contents', title: ' '}))
				.process(mainHtml, {sync: true})
				.html;

			// Store
			this.helpHtml = resHtml;
		}

		// Return
		return this.helpHtml;
	}


	// A panel (containing the webview).
	protected vscodePanel: vscode.WebviewPanel;


	/**
	 * Creates the text view.
	 */
	constructor() {
		// Create vscode panel view
		this.vscodePanel = vscode.window.createWebviewPanel('', '', {preserveFocus: true, viewColumn: vscode.ViewColumn.Nine}, {enableScripts: true, enableFindWidget: true, retainContextWhenHidden: true});

		/*
		// Handle messages from the webview
		this.vscodePanel.webview.onDidReceiveMessage(async message => {
			//console.log("webView command '"+message.command+"':", message);
			await this.webViewMessageReceived(message);
		});
		*/

		// Handle closing of the view
		this.vscodePanel.onDidDispose(() => {
			// Call overwritable function
			this.vscodePanel = undefined;
			HelpView.singleton = undefined as any;
		});


		// Title
		this.vscodePanel.title = "Binary-File-Viewer Help";

		// Get the html
		let html = HelpView.getHelpHtml();

		// Substitute the resource path
		const extPath = PackageInfo.extensionPath();
		const resourcePath = vscode.Uri.file(path.join(extPath, 'assets', 'help'));
		const vscodeResPath = this.vscodePanel.webview.asWebviewUri(resourcePath).toString();
		html = html.replace('${vscodeResPath}', vscodeResPath);

		// Use the text
		this.vscodePanel.webview.html = html;
	}


	/**
	 * Put webview to the foreground.
	 */
	public reveal() {
		this.vscodePanel.reveal();
	}


	/**
	 * User has clicked on a link.
	 * The help view is made visible and it is jumped to the chapter.
	 */
	public navigateToChapter(chapter: string) {
		// Jump to chapter
		const message = {command: 'navigate', data: chapter};
		//this.sendMessageToWebView(message);
		this.vscodePanel.webview.postMessage(message);
	}
}

