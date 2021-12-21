import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {ParserSelect} from './parserselect';


/**
 * This document stores some info, e.g. the parser used.
 */
export class EditorDocument implements vscode.CustomDocument {
	// The associated uri of the binary file.
	public uri: vscode.Uri;

	// The used parser file.
	public parser: {contents: string, filePath: string};

	public dispose(): void {
		//
	}


	/**
	 * Initializes the document with the webviewpanel.
	 * Reads the data file and starts parsing.
	 * @param webviewPanel The webview pael passed from vscode.
	 */
	public init(webviewPanel: vscode.WebviewPanel) {
		try {
			// Allow js
			webviewPanel.webview.options = {
				enableScripts: true
			};

			const filePath = this.uri.fsPath;
			const parser = this.parser;

			// Handle 'ready' message from the webview
			webviewPanel.webview.onDidReceiveMessage(message => {
				switch (message.command) {
					case 'ready':
						// Read file
						const dataFs = fs.readFileSync(filePath);
						const data = Uint8Array.from(dataFs);
						// Send data and parser
						this.sendDataToWebView(data, webviewPanel);
						this.sendParserToWebView(parser.contents, webviewPanel);
						break;
					case 'customParserError':
						// An error occurred during execution of the custom parser
						const stacks = message.text.split('\n');
						const match = /.*>:(\d+)/.exec(stacks[1]);
						let line = 0;
						if (match) {
							line = parseInt(match[1]);
							line -= 4;	// The reported number is too high, don't know why.
						}
						ParserSelect.addDiagnosticsMessage(stacks[0], parser.filePath, line);
						break;
				}
			});

			// Create html code
			const html = this.getMainHtml(webviewPanel);
			webviewPanel.webview.html = html;
		}
		catch (e) {
			console.error('Error: ', e);
		}
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
	 * @param parser The parser (js code) as a string
	 * @param webviewPanel The webview to send the data to.
	 */
	protected sendParserToWebView(parser: string, webviewPanel: vscode.WebviewPanel) {
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
	protected getMainHtml(webviewPanel: any) {
		// Add the html styles etc.
		const extPath = vscode.extensions.getExtension("maziac.binary-file-viewer")!.extensionPath;
		const mainHtmlFile = path.join(extPath, 'html/main.html');
		let mainHtml = fs.readFileSync(mainHtmlFile).toString();
		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = webviewPanel.webview.asWebviewUri(resourcePath).toString();
		mainHtml = mainHtml.replace('${vscodeResPath}', vscodeResPath);

		// Add a Reload and Copy button for debugging
		//mainHtml = mainHtml.replace('<body>', '<body><button onclick="parseStart()">Reload</button><button onclick="copyHtmlToClipboard()">Copy HTML to clipboard</button>');

		return mainHtml;
	}
}
