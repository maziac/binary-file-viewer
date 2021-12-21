import * as vscode from 'vscode';


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
}

