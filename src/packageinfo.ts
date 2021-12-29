import * as vscode from 'vscode';


/**
 * Reads the package.json of the extension.
 */
export class PackageInfo {

	// The extension info is stored here after setting the extensionPath.
	public static context: vscode.ExtensionContext;


	/**
	 * Sets the extension path.
	 * Called on extension activation.
	 */
	public static init(context: vscode.ExtensionContext) {
		this.context = context;
	}


	/**
	 * @returns The extension's name. E.g. 'binary-file-viewer', without the
	 * author.
	 */
	public static extensionId(): string {
		const complete = this.context.extension.id;
		const id = complete.split('.')[1];
		return id;
	}


	/**
	 * @returns The extension's absolute path.
	 */
	public static extensionPath(): string {
		const path = this.context.extension.extensionPath;
		return path;
	}


	/**
	 * Convenience method to return the configuration/the settings.
	 * @param workspaceFolder (Optional) The workspace folder to get the configuration for
	 * (in case of multiroot)
	 */
	public static configuration(workspaceFolder?: vscode.WorkspaceFolder): vscode.WorkspaceConfiguration {
		const id = this.extensionId();
		const config = vscode.workspace.getConfiguration(id, workspaceFolder);
		return config;
	}
}

