import * as vscode from 'vscode';
import * as fs from 'fs';
import {ActionType} from 'nsfw';
import * as path from 'path';
import {vmRunInNewContext} from './scopelessfunctioncall';
import {EditorDocument} from './editordocument';
//import * as nfsw from 'nsfw';
const nsfw = require('nsfw');
//import nfsw as Nsfw 'nsfw';


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

	// A map which associates file extensions with parser functions.
	protected static fileExtParserMap = new Map<string, string[]>(); // TODO : Remove

	// Filename -> contents association for the parser files.
	protected static fileParserMap = new Map<string, string>();

	// An array with all the active file watchers.
	protected static fileWatchers: any[] = [];


	/**
	 * Initializes the path.
	 */
	public static init(parserFolders: string[]) {
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
	 * @param filepath Absolute path to the file.
	 * @param line The line number. Starts at 0.
	 * @param columnStart The start column number. Starts at 1 (?).
	 * @param columnWidth The width of the selection.
	 */
	public static addDiagnosticsMessage(message: string, filepath: string, line: number, columnStart = 0, columnWidth = 1000) {
		const uri = vscode.Uri.file(filepath);
		const range = new vscode.Range(line, columnStart, line, columnStart + columnWidth);
		const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
		this.diagnosticsCollection.set(uri, [diagnostic]);
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
			try {
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
				// Output to vscode's PROBLEM area.
				this.addDiagnosticsMessage('' + e, fullPath, 0);
			}
		}
		catch (e) {
			console.log(e);
			// Output to vscode's PROBLEM area.
			this.addDiagnosticsMessage('' + e, folderPath + '/', 0);
		}

	}


	/**
	 * Reads the contents of a single file and adds it to the map.
	 * @param filePath The full file path of the parser file to read.
	 */
	protected static readFile(filePath: string) {
		// Read file contents
		const fileContents = fs.readFileSync(filePath).toString();

		// Covert into function to check for errors
		// b) run it to run 'registerFileType' and then the registered function
		let registerFileTypeFound = false;
		let registerParserFound = false;
		try {
			vmRunInNewContext(fileContents, {
				registerFileType: (func: (fileExt: string, filePath: string, data: any) => string) => {
					// Check if function is used
					registerFileTypeFound = true;
				},
				registerParser: (func: () => void) => {
					// Check if function is used
					registerParserFound = true;
				}
			},
			filePath);
		}
		catch (err) {
			console.log(err);
			// Parse line number
			const stacks = err.stack.split('\n');
			const matchLine = /.*:(\d+)/.exec(stacks[0]);
			const lineNr = parseInt(matchLine[1]);
			// Get column number
			const colNr = stacks[2].replace(/[^ ]/g, '').length;	// Remove everything that is not a space to count the spaces.
			const colWidth = stacks[2].replace(/[^\^]/g, '').length;
			// Output to vscode's PROBLEM area.
			this.addDiagnosticsMessage(stacks[4], filePath, lineNr - 1, colNr, colWidth);
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
		// And update any existing document
		EditorDocument.updateDocumentsFor(filePath, fileContents);
	}


	/*

			// b) run it to run 'registerFileType' and then the registered function
			scopeLessFunctionCall(fileContents, {
				registerParser: (func: () => void) => {},	// Unused here.
				registerFileType: (func: (fileExt: string, filePath: string, data: any) => void) => {
					let fileExt = path.extname(filePath);
					if (fileExt.startsWith('.'))
						fileExt = fileExt.substring(1);
					const selected = func(filePath, fileExt, undefined);	// TODO: data
					return selected;
				}
			});
			*/


	/**
	 * Register an parser function for an extension.
	 * It is possible to register more than one function to one extension.
	 * @param fileExtension E.g. "obj" or "bin". Not used.
	 * @param parserFile The absolute path to the parser file.
	 */
	public static registerParser(fileExtension: string, parserFile: string) {
		let funcArr = this.fileExtParserMap.get(fileExtension);
		if (!funcArr) {
			// First function. Create a new array.
			funcArr = [];
			this.fileExtParserMap.set(fileExtension, funcArr);
		}
		funcArr.push(parserFile);
	}


	/**
	 * Returns the right parser file for the given file extension.
	 * @param fileExtension Eg. "obj".
	 * @returns The full path name to the parser file or undefined if none exists.
	 */
	protected static getFileForExt(fileExtension: string): string {
		const parserFileArr = this.fileExtParserMap.get(fileExtension);
		if (!parserFileArr)
			return undefined;
		// Select the right file
		const parserFile = parserFileArr[0];	// TODO: for now simply the first one.

		return parserFile;
	}


	/**
	 * Select the right parser file (depending on the given file extension
	 * and copies it to the extension dir ('out/html').
	 * @param fileExt E.g. "obj"
	 * @param filePath The full (absolute) file path.
	 * @param data The file data object.
	 * @returns the parser contents and its file path on success. Otherwise undefined.
	 */
	public static selectParserFile(fileExt: string, filePath: string, data: any): {contents: string, filePath: string} {
		// Loop through all parsers
		let found = false;
		for (const [parserFilePath, parser] of this.fileParserMap) {
			// Run each parser 'registerFileType'
			vmRunInNewContext(parser, {
				registerFileType: (func: (fileExt: string, filePath: string, data: any) => boolean) => {
					// Evaluate custom function
					found = func(fileExt, filePath, data);
				},
				registerParser: (func: () => void) => {
					// Do nothing
				}
			},
				parserFilePath);

			if (found) {
				// If one is found stop here: // TODO: allow a selection
				return {contents: parser, filePath: parserFilePath};
			}
		}

		// Not found
		return undefined;
	}
}

// TODO: for now
ParserSelect.registerParser('.obj', '/Volumes/SDDPCIE2TB/Projects/Z80/vscode/binary-file-viewer/parsers/obj.js');
ParserSelect.registerParser('.raw', '/Volumes/SDDPCIE2TB/Projects/Z80/vscode/binary-file-viewer/parsers/obj.js');
