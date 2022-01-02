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
	public parser: ParserInfo;

	// If no parser is found this html is presented instead.
	public errorHtml: string;

	// Remember the webviewPanel for sending updates.
	public webviewPanel: vscode.WebviewPanel;


	// Keeps the list of open documents. Used in case a parser is updated.
	protected static documentList = new Set<EditorDocument>();


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
						// Read file
						const dataFs = fs.readFileSync(filePath);
						const data = Uint8Array.from(dataFs);
						// Send data and parser
						this.sendDataToWebView(data, webviewPanel);
						this.sendParserToWebView(this.parser, webviewPanel);
						break;
					case 'customParserError':
						// An error occurred during execution of the custom parser
						ParserSelect.addDiagnosticsStack(message.stack, this.parser.filePath);
						break;
				}
			});

			// Set the html
			const parser = ParserSelect.selectParserFile(filePath);
			this.setHtml(parser);
		}
		catch (e) {
			console.error('Error: ', e);
		}
	}


	/**
	 * Selects the right parser and sets the html.
	 */
	protected setHtml(parser: ParserInfo) {
		this.parser = parser;
		let html;
		if (this.parser) {
			// Create html code
			html = this.getMainHtml();
		}
		else {
			// Get all tried parsers.
			html = '<html><body>Binary-File-Viewer: No parser available.<br>';
			const parserPaths = ParserSelect.getParserFilePaths();
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
	 * @param parser The parser (js code) as a string plus the parser path.
	 * @param webviewPanel The webview to send the data to.
	 */
	protected sendParserToWebView(parser: {contents: string, filePath: string}, webviewPanel: vscode.WebviewPanel) {
		// Send the parser to the webview
		const message = {
			command: 'setParser',
			parser
		};
		webviewPanel.webview.postMessage(message);
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
	 * @param parser The new ParserInfo.
	 * @param updateInAnyCase If true the file is re-parsed even if the contents did not change.
	 */
	public updateParser(parser: ParserInfo, updateInAnyCase: boolean) {
		// If this.parser is undefined there was no parser found in the past.
		if (!this.parser) {
			// No previous parser
			if (parser)
				this.setHtml(parser);
		}
		else {
			// Previous parser exists
			if (!parser) {
				// But not anymore
				this.setHtml(parser);
			}
			else {
				// New parser might be different
				if (updateInAnyCase || (this.parser.contents != parser.contents)) {
					// Yes it's different, use the new parser
					this.sendParserToWebView(parser, this.webviewPanel);
				}
				this.parser = parser;
			}
		}
	}

}
