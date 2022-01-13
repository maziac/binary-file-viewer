import * as vscode from 'vscode';
import * as fs from 'fs';
import {vmRunInNewContext} from './scopelessfunctioncall';
import {EditorDocument} from './editordocument';
import {FileData} from './filedata';
import {UnifiedPath} from './unifiedpath';


/**
 * Object used to pass parser information.
 * Consists of the parser file path and its contents.
 */
export interface ParserInfo {
	// The parser contents as string.
	contents: string,

	// The absolute file path.
	filePath: string
}


/**
 * Select the right parser by the file extension and other means.
 * The custom parser calls the function register file type (normally one
 * time, but could be more).
 * Here it installs a function (by calling 'registerFileType') that
 * checks the given file. This can be by
 * - file extension
 * - file name (e.g. glob pattern) or
 * - by the byte contents of the file itself.
 * If the byte pattern is used the file is lazy loaded.
 * I.e. normally just the file extension is checked in that case no data from
 * the file is read at all.
 *
 */
export class ParserSelect {

	// The diagnostics collection.
	public static diagnosticsCollection = vscode.languages.createDiagnosticCollection("Binary File Viewer");


	// Filename -> contents association for the parser files.
	protected static fileParserMap = new Map<string, string>();

	// An array with all the active file watchers.
	protected static fileWatchers: vscode.FileSystemWatcher[] = [];

	// A copy of the array of parser folder from the settings.
	protected static parserFolders: string[];

	// Will be filled by init with all parser folders that are ot included in workspaces
	// and can therefore not be observed.
	protected static unobservedFolder: string[];


	/**
	 * Starts the file watcher for the given parser folders.
	 * Due to a restriction in vscode it is only possible to watch for files/folders
	 * in the current workspaces.
	 */
	public static init(parserFolders: string[]) {
		// Remember
		this.parserFolders = UnifiedPath.getUnifiedPathArray(parserFolders);

		// New parser map
		this.fileParserMap.clear();

		// Remove any previous watchers.
		for (const fileWatcher of this.fileWatchers) {
			fileWatcher.dispose();
		}
		this.fileWatchers = [];
		this.unobservedFolder = [];

		// Setup a file watcher on the 'parsers' directory
		// Note: vscode's createFileSystemWatcher can only watch for changes in the workspace.
		this.clearDiagnostics();
		for (const folder of this.parserFolders) {
			try {
				console.log('parserFolder:', folder);

				// Check if parser folder is included in work space
				if (this.inWorkspace(folder)) {
					// Is included in workspace: Truncate for the workspace
					const pattern = new vscode.RelativePattern(folder, '*.js');
					console.log('  relativePattern:', pattern);
					//const pattern = path.join(folder, '*.js');
					const fsWatcher = vscode.workspace.createFileSystemWatcher(pattern);
					this.fileWatchers.push(fsWatcher);
					fsWatcher.onDidChange(uri => {
						console.log('ParserSelect : onDidChange : uri', uri);
						// File modified
						ParserSelect.clearDiagnostics();
						ParserSelect.fileModified(uri);
					});
					fsWatcher.onDidCreate(uri => {
						console.log('ParserSelect : onDidCreate : uri', uri);
						// File modified
						ParserSelect.clearDiagnostics();
						ParserSelect.fileModified(uri);
					});
					fsWatcher.onDidDelete(uri => {
						console.log('ParserSelect : onDidDelete : uri', uri);
						// File modified
						ParserSelect.clearDiagnostics();
						ParserSelect.fileDeleted(uri);
					});
					// Read files initially.
					this.fileParserMap = this.readAllFiles(folder);
				}
				else {
					// Is not included in workspace. Save.
					this.unobservedFolder.push(folder);
				}

			}
			catch (e) {
				console.log(e);
				// Output to vscode's PROBLEM area.
				this.addDiagnosticsMessage('' + e, folder + '/', 0);
			}
		}
		// Update any existing docs
		this.updateAllOpenEditors(undefined);
	}


	/**
	 * Checks if folder is in one of the workspace folders.
	 * @param folder The folder path (absolute) to check.
	 * @returns true if included in one of the workspaces.
	 */
	protected static inWorkspace(folder: string): boolean {
		for (const ws of vscode.workspace.workspaceFolders) {
			const path = UnifiedPath.getUnifiedPath(ws.uri.fsPath);
			if (folder.startsWith(path))
				return true;	// Found
		}
		// Not found
		return false;
	}


	/**
	 * Clears all diagnostics messages.
	 */
	public static clearDiagnostics() {
		this.diagnosticsCollection.clear();
	}


	/**
	 * Adds a diagnostics message for a file.
	 * @param message The shown message.
	 * @param filePath Absolute path to the file.
	 * @param line The line number. Starts at 0.
	 * @param columnStart The start column number. Starts at 1 (?).
	 * @param columnWidth The width of the selection.
	 */
	public static addDiagnosticsMessage(message: string, filePath: string, line: number, columnStart = 0, columnWidth = 1000) {
		if (line < 0)
			line = 0;
		if (columnStart != undefined && columnStart < 1)
			columnStart = 1;
		if (columnWidth != undefined && columnWidth < 0)
			columnWidth = 0;
		const uri = vscode.Uri.file(filePath);
		const range = new vscode.Range(line, columnStart, line, columnStart + columnWidth);
		const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
		this.diagnosticsCollection.set(uri, [diagnostic]);
	}


	/**
	 * Adds an error to the diagnostics messages.
	 * Parses the stack to get the right line.
	 * @param errStack The error.stack obtained by a catch.
	 * @param filePath Absolute path to the file.
	 * @param lineOffset Number added to the line number. This is required for some
	 * sources (e.g. parser.js). Otherwise the wrong line number os reported.
	 */
	public static addDiagnosticsStack(errStack: string, filePath: string, lineOffset = 0) {
		let colNr;
		let colWidth;
		// An error occurred during execution of the custom parser
		const stacks = errStack.split('\n');
        //console.log('ParserSelect : addDiagnosticsStack : stacks', stacks);
		let lineNr = 0;
		let i = 0;
		for (; i < stacks.length; i++) {
			const match = /.*>:(\d+)(:(\d+))?/.exec(stacks[i]);
			if (match) {
				lineNr = parseInt(match[1]);
				if (match[3]) {
					// Column
					colNr = parseInt(match[3])-1;
					colWidth = 1000;
				}
				break;
			}
		}

		// There are 2 types of error messages.
		// Type a: Contains line and column information, e.g.
		//         '\tat evalmachine.<anonymous>:5:2'
		//         The error description is in the first line.
		//         This type of error I, e.g., get from the webview (parser.js).
		// Type b: Contains only line information, e.g.
		//         'evalmachine.<anonymous>:19'
		//         The error description is in the line after.
		//         Followed by characters indicating the column, e.g.:
		//         '                 ^^^^'
		//         This type of error I, e.g., get from the extension (e.g. parserselect.ts).
		// I.e. the 2 types are differentiated by the existence of the column number.
		// Note: the npm module stacktrace-parser cannot cope with the column info of type b.
		let msg;
		if (colNr == undefined) {
			// Type b
			msg = stacks[i + 1];
			if (i > 0)
				msg += ' (Probably an error in the passed arguments.)';
			// Get column
			if (i + 2 < stacks.length) {
				colNr = stacks[i + 2].replace(/[^ ]/g, '').length;	// Remove everything that is not a space to count the spaces.
				colWidth = stacks[i + 2].replace(/[^\^]/g, '').length;
			}
		}
		else {
			// Type a
			msg = stacks[0];
			if (i > 1)
				msg += ' (Probably an error in the passed arguments.)';
		}

		// Output to vscode's PROBLEM area.
		lineNr += lineOffset;
		this.addDiagnosticsMessage(msg, filePath, lineNr - 1, colNr, colWidth);
	}


	/**
	 * Called for every modified file.
	 * @param uri The file uri.
	 */
	protected static fileModified(uri: vscode.Uri) {
		try {
			// Read the file
			const filePath = uri.fsPath;
			const parser = this.readFile(filePath);
			if (parser)
				this.fileParserMap.set(filePath, parser);
			// Update the files. Since file type registration might have changed, all files need to be checked.
			setTimeout(() => {
				// In case of a rename, vscode does a MODIFIED (new file name) followed by a DELETED (old file name). This would result for a short while in 2 parsers for the same file name.
				// To avoid that (error message) the MODIFIED is delayed a little while.
				this.updateAllOpenEditors(filePath);
			}, 100);
		}
		catch (e) {
			console.log(e);
		}
	}


	/**
	 * Called for every deleted file.
	 * @param uri The file uri.
	 */
	protected static fileDeleted(uri: vscode.Uri) {
		try {
			// Remove the file
			//const filePath = path.join(event.directory, event.file);
			const filePath = uri.fsPath;
			this.fileParserMap.delete(filePath);
			// Update the files. It might be that no file is present anymore for the file type.
			this.updateAllOpenEditors(undefined);
		}
		catch (e) {
			console.log(e);
		}
	}


	/**
	 * Called for every renamed file.
	 * NOT USED.
	 * @param uri The file uri.
	 */
	/*
	protected static fileModified(uri: vscode.Uri) {
		try {
			// Note: Renaming in vscode results in: DELETED, CREATED.
			// On macOS finder it is: RENAMED.
			// Remove the old file name
			const oldFilePath = path.join(event.directory, event.oldFile);
			this.fileParserMap.delete(oldFilePath);
			// Read the new file name
			const newFilePath = path.join(event.newDirectory, event.newFile);
			this.readFile(newFilePath);
			// Update the files. It might be that no file is present anymore for the file type.
			this.updateAllOpenEditors(newFilePath);	// 'newFilePath' to make sure the file is re-read to update the PROBLEM page.
		}
		catch (e) {
			console.log(e);
		}
	}
	*/


	/**
	 * Reads all files in the given path.
	 * @param folderPath The folder to use.
	 * @returns Map with filename -> contents association for the parser files.
	 */
	protected static readAllFiles(folderPath: string): Map<string, string> {
		const parserMap = new Map<string, string>();
		try {
			const files = fs.readdirSync(folderPath, {withFileTypes: true});
			let fullPath;
			for (const file of files) {
				fullPath = UnifiedPath.join(folderPath, file.name);
				if (file.isDirectory()) {
					// Dig recursively
					const dirMap = this.readAllFiles(fullPath);
					// Merge with map
					dirMap.forEach((path, parser) => parserMap.set(path, parser));
				}
				else {
					// Read file
					const parser = this.readFile(fullPath);
					if(parser != undefined)
						parserMap.set(fullPath, parser);
				}
			}
		}
		catch (e) {
			console.log(e);
			vscode.window.showErrorMessage(e.toString());
		}
		return parserMap;
	}


	/**
	 * Reads the contents of a single file and adds it to the map.
	 * @param filePath The full file path of the parser file to read.
	 * @returns The parser contents. Or undefined in case of an error.
	 */
	protected static readFile(filePath: string): string|undefined {
		// Skip if not a js file
		if (UnifiedPath.extname(filePath) != '.js')
			return undefined;

		// Read file contents
		try {
			const fileContents = fs.readFileSync(filePath).toString();

			// Covert into function to check for errors
			// b) run it to run 'registerFileType' and then the registered function
			let registerFileTypeFound = false;
			let registerParserFound = false;
			try {
				vmRunInNewContext(fileContents, {
					registerFileType: (func: (fileExt: string, filePath: string, fileData: FileData) => boolean) => {
						// Check if function is used
						registerFileTypeFound = true;
					},
					registerParser: (func: () => void) => {
						// Check if function is used
						registerParserFound = true;
					}
				});
			}
			catch (err) {
				console.log(err);
				// Show error
				this.addDiagnosticsStack(err.stack, filePath);
				return undefined;
			}

			// Check if functions are used
			if (!registerFileTypeFound || !registerParserFound) {
				if (!registerFileTypeFound) {
					// Output to vscode's PROBLEM area.
					this.addDiagnosticsMessage("You need to register for a file type via 'registerFileType'.", filePath, 0);
				}
				if (!registerParserFound) {
					// Output to vscode's PROBLEM area.
					this.addDiagnosticsMessage("You need to register a parser via 'registerParser'.", filePath, 0);
				}
				return undefined;
			}

			// Return
			return fileContents;
		}
		catch (e) {
			console.log(e);
			vscode.window.showErrorMessage(e.toString());
			return undefined;
		}
	}


	/**
	 * Select the right parser file and returns it.
	 * If several parsers are found a warning is shown and the first one is selected.
	 * @param filePath The full (absolute) file path.
	 * @returns the parser contents and its file path on success. Otherwise undefined.
	 */
	public static selectParserFile(filePath: string): ParserInfo {
		// Get the file extension
		let fileExt = UnifiedPath.extname(filePath);
		if (fileExt.length >= 1)
			fileExt = fileExt.slice(1); 	// Remove the '.'

		// Create file data object
		const fileData = new FileData(filePath);

		// Loop through all parsers, observed and unobserved
		const foundParsers: ParserInfo[] = [];
		for (const [parserFilePath, parser] of this.fileParserMap) {
			// Run each parser 'registerFileType'
			try {
				const found = this.runRegisterFileType(parser, fileExt, filePath, fileData);
				if (found) {
					foundParsers.push({contents: parser, filePath: parserFilePath});
				}
			}
			catch (e) {
				// Show error
				this.addDiagnosticsStack(e.stack, parserFilePath);
			}
		}

		// Now loop through all unobserved folders.
		for (const folder of this.unobservedFolder) {
			// Read each parser file.
			const parserMap = this.readAllFiles(folder);
			for (const [parserFilePath, parser] of parserMap) {
				// Run each parser 'registerFileType'
				try {
					const found = this.runRegisterFileType(parser, fileExt, filePath, fileData);
					if (found) {
						foundParsers.push({contents: parser, filePath: parserFilePath});
					}
				}
				catch (e) {
					// Show error
					this.addDiagnosticsStack(e.stack, parserFilePath);
				}
			}
		}

		// Close, in case it was opened.
		fileData.close();

		// Check for no selection
		const len = foundParsers.length;
		if (len == 0)
			return undefined;

		// Check for multiple selections
		if (len > 1) {
			// Show warning
			let msg = "Multiple parsers found for '" + filePath + "': ";
			let sep = '';
			for (const parser of foundParsers) {
				msg += sep + UnifiedPath.basename(parser.filePath);
				sep = ', ';
			}
			msg += '. Choosing the first one.';
			vscode.window.showWarningMessage(msg);
		}

		// Returning the first one.
		return foundParsers[0];
	}


	/**
	 * Runs the 'registerFileType' and it's registered function to validate if the given file
	 * is the right one for parsing.
	 * @param parser The parser file contents (to be executed).
	 * @param fileExt The file extension, e.g. "wav".
	 * @param filePath The full absolute path.
	 * @param fileData The contents of the file.
	 * @returns true if the parser was registered for this file.
	 */
	protected static runRegisterFileType(parser: string, fileExt: string, filePath: string, fileData: FileData): boolean {
		let found = false;

		// Run 'registerFileType'
		vmRunInNewContext(parser, {
			registerFileType: (func: (fileExt: string, filePath: string, fileData: FileData) => boolean) => {
				try {
					// Evaluate custom function
					found = func(fileExt, filePath, fileData);
				}
				catch (err) {
					console.log(err);
					throw err;
				}
			},
			registerParser: (func: () => void) => {
				// Do nothing
			}
		});

		return found;
	}


	/**
	 * Is called whenever a js file changes.
	 * When the file changes, also the file type might have changed.
	 * Therefore it is necessary to run 'selectParser' on all open editors
	 * once again.
	 * @param changedFilePath This file was the originator for the call.
	 * The doc is updated also if the file contents actually did not change.
	 */
	public static updateAllOpenEditors(changedFilePath: string) {
		const docs = EditorDocument.getDocuments();
		for (const doc of docs) {
			const filePath = doc.uri.fsPath;
			const parser = this.selectParserFile(filePath);
			const updateInAnyCase = (changedFilePath == parser?.filePath);
			doc.updateParser(parser, updateInAnyCase);
		}
	}


	/**
	 * @returns All available parser file paths.
	 */
	public static getParserFilePaths(): string[] {
		const parserPaths: string[] = Array.from(this.fileParserMap.keys());
		return parserPaths;
	}


	/**
	 * Check if the given document matches one of the parser folder paths.
	 * @param document The document e.g. from a document from one of the providers.
	 * @returns true if document is  a parser file.
	 */
	public static isParser(document: vscode.TextDocument): boolean {
		// Note: I cannot compare the fileParserMap as the map contains onl valid files (without errors).

		// First check for right path
		for (const pattern of this.parserFolders) {
			const docFilter: vscode.DocumentFilter = {pattern: pattern + '/**/*.js'};
			if (vscode.languages.match(docFilter, document) > 0) {
				return	true;
			}
		}
		// Not found
		return false;
	}

}
