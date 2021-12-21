import * as vscode from 'vscode';
import * as path from 'path';
import {EditorDocument} from './editordocument';
import {ParserSelect} from './parserselect';


export class EditorProvider implements vscode.CustomReadonlyEditorProvider {

	/**
	 * Called by vscode when a file is opened.
	 * Create document
	 */
	public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
		try {
			// Get the parser contents
			const filePath = uri.fsPath;
			let fileExt = path.extname(filePath);
			if (fileExt.length >= 1)
				fileExt = fileExt.slice(1); 	// Remove the '.'
			const parser = ParserSelect.selectParserFile(fileExt, filePath, undefined);
			if (!parser)
				return undefined;	// Nothing found

			// Create a document
			const doc = new EditorDocument();
			doc.uri = uri;
			doc.parser = parser;
			// Return a document
			return doc;
		}
		catch (e) {
			console.log(e);
			return undefined;
		}
	}


	/**
	 * Called by vscode.
	 * Here vscode gives us the webview.
	 */
	public resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
		const doc = document as EditorDocument;
		doc.init(webviewPanel);
	}

}
