import * as vscode from 'vscode';
import * as fs from 'fs';
import {ActionType} from 'nsfw';
import * as path from 'path';
import {vmRunInNewContext} from './scopelessfunctioncall';
import {EditorDocument} from './editordocument';
import {FileData} from './filedata';
const nsfw = require('nsfw');


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
	protected static fileWatchers: any[] = [];

	// A copy of the array of parser folder from the settings.
	protected static parserFolders: string[];


	/**
	 * Initializes the path.
	 */
	public static init(parserFolders: string[]) {
		// Remember
		this.parserFolders = parserFolders;

		// Remove any previous watchers.
		for (const fileWatcher of this.fileWatchers) {
			fileWatcher.stop();
		}
		this.fileWatchers = [];

		// Setup a file watcher on the 'parsers' directory
		// Note: vscode's createFileSystemWatcher can only watch for changes in the workspace.
		this.clearDiagnostics();
		for (const folder of parserFolders) {
			try {
				nsfw(folder,
					function (events: any) {
						console.log(events);
						// Loop array of events
						ParserSelect.clearDiagnostics();
						for (const event of events) {
							ParserSelect.fileChanged(event);
						}
					}
				)
					.then(function (watcher: any) {
						// Remember
						ParserSelect.fileWatchers.push(watcher);
						// And start watching
						return watcher.start();
					});

				// Read files initially.
				this.readAllFiles(folder);
			}
			catch (e) {
				console.log(e);
				// Output to vscode's PROBLEM area.
				this.addDiagnosticsMessage('' + e, folder + '/', 0);
			}
		}
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
	 * @param err The error obtained by a catch.
	 * @param filePath Absolute path to the file.
	 */
	protected static addDiagnosticsStack(err: Error, filePath: string) {
		let colNr;
		let colWidth;
		// An error occurred during execution of the custom parser
		const stacks = err.stack.split('\n');
        console.log('ParserSelect : addDiagnosticsStack : stacks', stacks);
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
		//         The error description is in the previous line.
		// Type b: Contains only line information, e.g.
		//         'evalmachine.<anonymous>:19'
		//         The error description is in the line after.
		//         Followed by characters indicating the column, e.g.:
		//         '                 ^^^^'
		// I.e. the 2 types are differentiated by the existence of the column number.
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
			msg = stacks[i - 1];
			if (i > 1)
				msg += ' (Probably an error in the passed arguments.)';
		}

		// Output to vscode's PROBLEM area.
		this.addDiagnosticsMessage(msg, filePath, lineNr - 1, colNr, colWidth);
	}


	/**
	 * Called for every single file change.
	 */
	protected static fileChanged(event: any) {
		try {
			// Check type of change
			if (event.action == ActionType.CREATED || event.action == ActionType.MODIFIED) {
				// Read the file
				const filePath = path.join(event.directory, event.file);
				this.readFile(filePath);
				// Update the files. Since file type registration might have changed, all files need to be checked.
				this.updateAllOpenEditors();
			}

			// TODO: Handle renamed, deleted
		}
		catch (e) {
			console.log(e);
		}
	}


	/**
	 * Reads all files in the given path.
	 * @param folderPath The folder to use.
	 */
	protected static readAllFiles(folderPath: string) {
		try {
			const files = fs.readdirSync(folderPath, {withFileTypes: true});
			let fullPath;
			for (const file of files) {
				fullPath = path.join(folderPath, file.name);
				if (file.isDirectory()) {
					// Dig recursively
					this.readAllFiles(fullPath);
				}
				else {
					// Read file
					this.readFile(fullPath);
				}
			}
		}
		catch (e) {
			console.log(e);
			vscode.window.showErrorMessage(e.toString());
		}
	}


	/**
	 * Reads the contents of a single file and adds it to the map.
	 * @param filePath The full file path of the parser file to read.
	 */
	protected static readFile(filePath: string) {
		// Skip if not a js file
		if (path.extname(filePath) != '.js')
			return;
	//	if (path.basename(filePath).startsWith('obj'))
	//		return;	// REMOVE TODO

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
				this.addDiagnosticsStack(err, filePath);
				return;
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
				return;
			}

			// If everything is fine, add to map
			this.fileParserMap.set(filePath, fileContents);
		}
		catch (e) {
			console.log(e);
			vscode.window.showErrorMessage(e.toString());
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
		let fileExt = path.extname(filePath);
		if (fileExt.length >= 1)
			fileExt = fileExt.slice(1); 	// Remove the '.'

		// Create file data object
		const fileData = new FileData(filePath);

		// Loop through all parsers
		const foundParsers: ParserInfo[] = [];
		for (const [parserFilePath, parser] of this.fileParserMap) {
			// Run each parser 'registerFileType'
			vmRunInNewContext(parser, {
				registerFileType: (func: (fileExt: string, filePath: string, fileData: FileData) => boolean) => {
					try {
						// Evaluate custom function
						const found = func(fileExt, filePath, fileData);
						if (found) {
							foundParsers.push({contents: parser, filePath: parserFilePath});
						}
					}
					catch (err) {
						console.log(err);
						// Show error
						this.addDiagnosticsStack(err, parserFilePath);
						return;
					}
				},
				registerParser: (func: () => void) => {
					// Do nothing
				}
			});
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
				msg += sep + path.basename(parser.filePath);
				sep = ', ';
			}
			msg += '. Choosing the first one.';
			vscode.window.showWarningMessage(msg);
		}

		// Returning the first one.
		return foundParsers[0];
	}


	/**
	 * Is called whenever a js file changes.
	 * When the file changes, also the file type might have changed.
	 * Therefore it is necessary to run 'selectParser' on all open editors
	 * once again.
	 */
	public static updateAllOpenEditors() {
		const docs = EditorDocument.getDocuments();
		for (const doc of docs) {
			const filePath = doc.uri.fsPath;
			const parser = this.selectParserFile(filePath);
			doc.updateParser(parser);
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
