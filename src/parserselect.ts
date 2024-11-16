import * as vscode from 'vscode';
import * as fs from 'fs';
import {vmRunInNewContext} from './scopelessfunctioncall';
import {EditorDocument} from './editordocument';
import {FileData} from './filedata';
import * as path from 'path';


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

	// A copy of the array of parser folder from the settings.
	// Only used for 'isParser' for hover, completion and signature provider.
	protected static parserFolders: string[];

	// Collect the tested parsers for error reporting in 'selectParser'.
	protected static testedParserFilePaths: string[];


	/**
	 * Starts the file watcher for the given parser folders.
	 * Due to a restriction in vscode it is only possible to watch for files/folders
	 * in the current workspaces.
	 */
	public static init(parserFolders: string[]) {
		// Init
		this.parserFolders = parserFolders;
		this.testedParserFilePaths = [];
		//console.log("ParserSelect::init:", parserFolders);

		this.clearDiagnostics();

		// Update any existing docs
		this.updateAllOpenEditors();
	}


	/**
	 * Check if the given uri is a parser uri.
	 * I.e. that it is a js file ad that it is contained in a parser folder.
	 * @param uri The uri to test.
	 * @returns true if it is a parser doc.
	 */
	public static isParserDoc(uri: vscode.Uri): boolean {
		// Check if js file in right folder
		const filePath = uri.fsPath;
		for (const parserFolder of this.parserFolders) {
			// Check path
			const relPath = this.getRelativePath(parserFolder, filePath)
			if (!relPath)
				continue;
			// Check extension
			if (path.extname(filePath) != '.js')
				continue;
			// Path and extension ok: It's a parser file.
			return true;
		}
		// Not found
		return false;
	}


	/**
	 * Text documents have been created. Not so important, but can e.g. happen by
	 * an undo. Check if it is a js parser file and update the file viewers.
	 * @param doc The deleted doc.
	 */
	public static updateIfParserFile(uris: readonly vscode.Uri[]) {
		// Check if js file in right folder
		for (const uri of uris) {
			// Check if js file in right folder
			if (this.isParserDoc(uri)) {
				// Found
				this.updateAllOpenEditors();
				break;	// Stop here, one update is enough
			}
		}
	}


	/**
	 * Make sure that on windows the drive letter is always lower case.
	 * As path is an absolute path it either starts with the drive letter
	 * or '/'.
	 * @param path An absolute path, e.g. "C:\Folder".
	 * @returns E.g. "c:\Folder".
	 */
	/* At the moment this is not required:
	protected static lowerCaseDriveLetter(path: string): string {
		if (!path)
			return path;
		const s = path[0].toLowerCase() + path.substring(1);
		return s;
	}
	*/


	/**
	 * Checks if child is sub file/folder of parent.
	 * Can handle windows and posix:
	 * 'C:\\Foo', 'c:\\foo\\Bar' => true
	 * '/c/foo', '/c/foo/bar' => true
	 * @param parent The parent dir.
	 * @param child The child dir to test.
	 * @returns The relative path or undefined if not included
	 */
	protected static getRelativePath(parent: string, child: string): string|undefined {
		const relative = path.relative(parent, child);
		const isIncluded = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
		if (isIncluded)
			return relative;
		// Not included
		return undefined;
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
		// Bring the PROBLEMS pane to the front
		vscode.commands.executeCommand('workbench.panel.markers.view.focus');
	}


	/**
	 * Adds an error to the diagnostics messages.
	 * Parses the stack to get the right line.
	 * @param errStack The error.stack obtained by a catch.
	 * @param filePath Absolute path to the file.
	 * @param lineOffset Number added to the line number. This is required for some
	 * sources (e.g. parser.js). Otherwise the wrong line number is reported.
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
			// Get column
			if (i + 2 < stacks.length) {
				colNr = stacks[i + 2].replace(/[^ ]/g, '').length;	// Remove everything that is not a space to count the spaces.
				colWidth = stacks[i + 2].replace(/[^^]/g, '').length;
			}
		}
		else {
			// Type a
			msg = stacks[0];
		}

		// Output to vscode's PROBLEM area.
		lineNr += lineOffset;
		this.addDiagnosticsMessage(msg, filePath, lineNr - 1, colNr, colWidth);
	}


	/**
	 * Reads all files in the given path.
	 * @param folderPath The folder to use. An absolute path.
	 * @returns Map with filename -> contents association for the parser files.
	 */
	protected static readAllFiles(folderPath: string): Map<string, string> {
		const parserMap = new Map<string, string>();
		try {
			const files = fs.readdirSync(folderPath, {withFileTypes: true});
			let fullPath;
			for (const file of files) {
				fullPath = path.join(folderPath, file.name);
				if (file.isDirectory()) {
					// Dig recursively
					const dirMap = this.readAllFiles(fullPath);
					// Merge with map
					dirMap.forEach((parser, path) => parserMap.set(path, parser));
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
			//console.log(e);
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
		if (path.extname(filePath) != '.js')
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
				//console.log(err);
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
			//console.log(e);
			vscode.window.showErrorMessage(e.toString());
			return undefined;
		}
	}


	/** Get all right parser file (for an extension) and returns them
	 * @param filePath The absolute file path of the file
	 * @returns All parser file paths on success. Otherwise undefined.
	 */
	public static getAvailableParsers(filePath: string): string[] {
		this.testedParserFilePaths = [];

		// Get the file extension
		let fileExt = path.extname(filePath);
		if (fileExt.length >= 1)
			fileExt = fileExt.slice(1); 	// Remove the '.'

		// Create file data object
		const fileData = new FileData(filePath);

		// Loop through all parsers and read them.
		const foundParsers: string[] = [];
		for (const folder of this.parserFolders) {
			// Read each parser file.
			const parserMap = this.readAllFiles(folder);
			for (const [parserFilePath, parser] of parserMap) {
				// Run each parser 'registerFileType'
				try {
					this.testedParserFilePaths.push(parserFilePath);
					const found = this.runRegisterFileType(parser, fileExt, filePath, fileData);
					if (found) {
						foundParsers.push(parserFilePath);
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

		// Returning the found parsers
		return foundParsers;
	}


	/** Get ParserInfo for a parser. I.e. the file contents.
	 * @param parserPath The full (absolute) path to the parser.
	 * @returns All parser contents and its file path on success. Otherwise undefined.
	 */
	public static getParserInfo(parserPath: string): ParserInfo | undefined {
		// Read parser file
		const parser = this.readFile(parserPath);
		if (parser === undefined)
			return undefined;
		return {contents: parser, filePath: parserPath};
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
					//console.log(err);
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
	public static updateAllOpenEditors(changedFilePath?: string) {
		const docs = EditorDocument.getDocuments();
		for (const doc of docs) {
			const filePath = doc.uri.fsPath;
			const [parser, parserPaths] = doc.getParserAndPaths(filePath);
			doc.updateParser(parser, parserPaths);
		}
	}


	/**
	 * @returns All available parser file paths.
	 */
	public static getTestedParserFilePaths(): string[] {
		return this.testedParserFilePaths;
	}
}
