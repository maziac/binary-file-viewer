import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {EditorDocument} from './editordocument';
import {ParserSelect} from './parserselect';
import {scopeLessFunctionCall} from './scopelessfunctioncall';


export class EditorProvider implements vscode.CustomReadonlyEditorProvider {

	/**
	 * Called by vscode when a file is opened.
	 * Create document
	 */
	public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
		// Return a document
		const doc = new EditorDocument();
		doc.uri = uri;
		return doc;
	}


	/**
	 * Called by vscode.
	 * Here vscode gives us the webview.
	 */
	public resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
		const doc = document as EditorDocument;

		// Allow js
		webviewPanel.webview.options = {
			enableScripts: true
		};

		try {
			// Copy the parser file
		//	const extFolder = vscode.extensions.getExtension(extName).extensionPath;
			const fileExt = path.extname(doc.uri.fsPath);
			if (!ParserSelect.selectParserFile(fileExt))
				return;

			// Read the file
			const filePath = doc.uri.fsPath;

			// Handle 'ready' message from the webview
			webviewPanel.webview.onDidReceiveMessage(message => {
				switch (message.command) {
					case 'ready':
						// Send data
						this.sendDataToWebView(filePath, webviewPanel);
						// Establish file watcher to check for changes
						const fsWatcher = vscode.workspace.createFileSystemWatcher(filePath, true, false, true);
						fsWatcher.onDidChange(() => {
							// Re-read data
							this.sendDataToWebView(filePath, webviewPanel);
						});
						// Cleanup
						webviewPanel.onDidDispose(() => {
							fsWatcher.dispose();
						});
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
	 * @param filePath The file name.
	 * @param webviewPanel The webview to send the data to.
	 */
	protected sendDataToWebView(filePath: string, webviewPanel: vscode.WebviewPanel) {
		// Send file data to webview
		const doc = fs.readFileSync(filePath);
		const message = {
			command: 'setData',
			data: [...doc]
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
