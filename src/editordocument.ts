import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {ParserInfo, ParserSelect} from './parserselect';




/**
 * This document stores some info, e.g. the parser used.
 */
export class EditorDocument implements vscode.CustomDocument {
	// The associated uri of the binary file.
	public uri: vscode.Uri;

	// The used parser file.
	public parser: ParserInfo | undefined;

	// The parser file selected
	public selected = 0;

	// Remember the webviewPanel for sending updates.
	public webviewPanel: vscode.WebviewPanel;


	// Keeps the list of open documents. Used in case a parser is updated.
	protected static documentList = new Set<EditorDocument>();

	// Create a channel for logging (dbgLog).
	protected static outChannel = vscode.window.createOutputChannel("Binary File Viewer");


	/**
	 * Returns all EditorDocuments in an array.
	 * @returns Array of active EditorDocuments.
	 */
	public static getDocuments(): EditorDocument[] {
		const arr = Array.from(this.documentList);
		return arr;
	}


	/**
	 * Remove from list.
	 */
	public dispose(): void {
		EditorDocument.documentList.delete(this);
	}



	/**
	 * Initializes the document with the webviewpanel.
	 * Reads the data file and starts parsing.
	 * @param webviewPanel The webview panel passed from vscode.
	 */
	public init(webviewPanel: vscode.WebviewPanel) {
		try {
			// Remember
			EditorDocument.documentList.add(this);
			this.webviewPanel = webviewPanel;

			// Allow js
			webviewPanel.webview.options = {
				enableScripts: true
			};

			// Normal behavior: Parser installed.
			// Handle 'ready' message from the webview
			const filePath = this.uri.fsPath;
			webviewPanel.webview.onDidReceiveMessage(message => {
				switch (message.command) {
					case 'ready':
						if (this.parser) {
							// Read file
							const dataFs = fs.readFileSync(filePath);
							const data = Uint8Array.from(dataFs);
							// Send data and parser
							this.sendDataToWebView(data, webviewPanel);
							this.sendParserToWebView();
						}
						break;
					case 'customParserError':
						if (this.parser) {
							// An error occurred during execution of the custom parser
							ParserSelect.addDiagnosticsStack(message.stack, this.parser.filePath, -3);
						}
						break;
					case 'selectLine':
						// Display the given line (and column) in the parser (js) file
						this.selectParserLine(message.offset);
						break;
					case 'changeParser':
						// Change the parser
						this.changeParser(Number(message.selected));
						break;
					case 'openCustomParser':
						// Display the parser (js) file
						this.openCustomParser();
						break;
					case 'reload':
						// Reload/re-parse the file
						const parsers = ParserSelect.getAllParserFile(filePath);
						this.updateParser((parsers) ? parsers[this.selected] : parsers);
						break;
					case 'dbgLog':
						// Print log into OUTPUT pane
						EditorDocument.outChannel.appendLine(message.arguments);
						break;
				}
			});

			// Set the html
			const parsers = ParserSelect.getAllParserFile(filePath);
			this.setHtml((parsers) ? parsers[this.selected] : parsers);
		}
		catch (e) {
			console.error('Error: ', e);
		}
	}


	/**
	 * Selects the right parser and sets the html.
	 */
	protected setHtml(parser: ParserInfo|undefined) {
		this.parser = parser;
		let html;
		if (this.parser) {
			// Create html code
			html = this.getMainHtml();
		}
		else {
			// Get all tried parsers.
			html = '<html><body>Binary-File-Viewer: No parser available.<br>';
			const parserPaths = ParserSelect.getTestedParserFilePaths();
			if (parserPaths.length > 0) {
				html += 'Tried parser(s):';
				for (const parserPath of parserPaths)
					html += '<br>' + parserPath;
			}
			html += '</body></html>';
		}
		this.webviewPanel.webview.html = html;
	}


	/**
	 * Reads the file and sends the data to the webview.
	 * @param data The file data to decode
	 * @param webviewPanel The webview to send the data to.
	 */
	protected sendDataToWebView(data: Uint8Array, webviewPanel: vscode.WebviewPanel) {
		// Send file data to webview
		const message = {
			command: 'setData',
			data
		};
		webviewPanel.webview.postMessage(message);
	}


	/**
	 * Reads the file and sends the data to the webview.
	 */
	protected sendParserToWebView() {
		// Send the parser to the webview
		const filePath = this.uri.fsPath;
		const message = {
			command: 'setParser',
			parsers: ParserSelect.getAllParserFile(filePath),
			binFilePath: this.uri.fsPath
		};
		this.webviewPanel.webview.postMessage(message);
	}


	/**
	 * Returns the html code to display the text.
	 */
	protected getMainHtml(): string {
		// Add the html styles etc.
		const extPath = vscode.extensions.getExtension("maziac.binary-file-viewer")!.extensionPath;
		const mainHtmlFile = path.join(extPath, 'html', 'main.html');
		let mainHtml = fs.readFileSync(mainHtmlFile).toString();
		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = this.webviewPanel.webview.asWebviewUri(resourcePath).toString();
		mainHtml = mainHtml.replace('${vscodeResPath}', vscodeResPath);

		// Add a Reload and Copy button for debugging
		//mainHtml = mainHtml.replace('<body>', '<body><button onclick="parseStart()">Reload</button><button onclick="copyHtmlToClipboard()">Copy HTML to clipboard</button>');

		return mainHtml;
	}


	/**
	 * Update the parser.
	 * Checks beforehand if an update is necessary.
	 * An update is done if the contents or the filepath (rename) is different.
	 * @param parser The new ParserInfo.
	 */
	public updateParser(parser: ParserInfo|undefined) {
		// If this.parser is undefined there was no parser found in the past.
		if (!this.parser) {
			// No previous parser
			if (parser) {
				ParserSelect.clearDiagnostics();
				this.setHtml(parser);
			}
		}
		// Previous parser exists
		else if (!parser) {
			// But not anymore
			ParserSelect.clearDiagnostics();
			this.setHtml(parser);
		}
		else {
			// New parser might be different
			if ((this.parser.contents != parser.contents) || (this.parser.filePath != parser.filePath)) {
				// Yes it's different, use the new parser
				ParserSelect.clearDiagnostics();
				this.parser = parser;
				this.sendParserToWebView();
			}
		}
	}


	/**
	 * Display the given line (and column) in the parser (js) file.
	 * The line is only selected if the file is already opened.
	 * Otherwise nothing happens.
	 * @param offset Contains the line info.
	 */
	protected selectParserLine(offset: {lineNr: number, colNr: number}) {
		if (!this.parser)
			return;
		for (const doc of vscode.workspace.textDocuments) {
			const fsPath = doc.uri.fsPath;
			if (fsPath === this.parser.filePath) {
				// Document found, select it
				vscode.window.showTextDocument(doc)
					.then(editor => {
						// Get line to estimate the column width
						const text = doc.getText().split('\n');
						const line = text[offset.lineNr];
						// Search for closed bracket
						let i = offset.colNr + 1;
						let bracketCount = 0;
						const len = line.length;
						while (i < len) {
							const char = line.substring(i, i + 1);
							i++;
							if (char == ')') {
								bracketCount--;
								if (bracketCount <= 0)
									break;
							}
							else if (char == '(') {
								bracketCount++;
							}
							// Next
						}
						const colEnd = i;
						// Select range
						const range = new vscode.Range(offset.lineNr, offset.colNr, offset.lineNr, colEnd);
						const selection = new vscode.Selection(offset.lineNr, offset.colNr, offset.lineNr, colEnd);
						editor.selection = selection;
						// Scroll to range first range
						editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
					});
				return;
			}
		}

		// Nothing found
	}


	/**
	 * Displays the parser (js) file.
	 * Called if user clicks the Open button.
	 */
	protected openCustomParser() {
		if (this.parser) {
			vscode.workspace.openTextDocument(this.parser.filePath)
				.then(doc => {
					vscode.window.showTextDocument(doc);
				});
		}
	}

	/**
	 * Change the parser (js) file.
	 * Called if user choose different option of the parsers dropdown.
	 */
	protected changeParser(selected) {
		this.selected = selected;
	}
}
