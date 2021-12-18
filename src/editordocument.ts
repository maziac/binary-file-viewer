import * as vscode from 'vscode';


export class EditorDocument implements vscode.CustomDocument {
	uri: vscode.Uri;
	public dispose(): void {
		//
	}
}

