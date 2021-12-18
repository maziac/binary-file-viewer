import * as fs from 'fs';
import {ActionType} from 'nsfw';
import * as path from 'path';
//import * as nfsw from 'nsfw';
const nsfw = require('nsfw');
//import nfsw as Nsfw 'nsfw';


/**
 * Select the right parser by the file extension.
 */
export class ParserSelect {

	// A map which associates file extensions with parser functions.
	protected static fileExtParserMap = new Map<string, string[]>();

	// Filename -> contents association for the parser files.
	protected static fileParserMap = new Map<string, string>();

	// Custom parser js file absolute path.
	protected static customParserPath: string;


	/**
	 * Initializes the path.
	 */
	public static init(extensionPath: string) {
		this.customParserPath = path.join(extensionPath, 'out', 'html', 'customparser.js');
		// Setup a file watcher on the 'parsers' directory
		// Note: vscode's createFileSystemWatcher can only watch for changes in the workspace.
		const parsersFolder = path.join(extensionPath, 'parsers');
		nsfw(parsersFolder,
			function (events: any) {
				console.log(events);
				// Loop array of events
				for (const event of events) {
					ParserSelect.fileChanged(event);
				}
			}
		)
			.then(function (watcher: any) {
				return watcher.start();
			});

		// Read files initially.
		this.readAllFiles(parsersFolder);
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
			for (const file of files) {
				const fullPath = path.join(folderPath, file.name);
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
		}
	}


	/**
	 * Reads the contents of a single file and adds it to the map.
	 * @param filePath The full file path of the parser file to read.
	 */
	protected static readFile(filePath: string) {
		const fileContents = fs.readFileSync(filePath).toString();
		this.fileParserMap.set(filePath, fileContents);
	}


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
	 * @returns true on success. false on failure, i.e. no parser file associated
	 * with extension.
	 */
	public static selectParserFile(fileExt: string): boolean {
		const parserFile = this.getFileForExt(fileExt);
		if (!parserFile)
			return false;
		try {
			// Copy file (overwrite any existing file)
			fs.copyFileSync(parserFile, this.customParserPath);
			return true;
		}
		catch (e) {
			console.error('Error: ', e);
			return false;
		}

	}
}

// TODO: for now
ParserSelect.registerParser('.obj', '/Volumes/SDDPCIE2TB/Projects/Z80/vscode/binary-file-viewer/parsers/obj.js');
ParserSelect.registerParser('.raw', '/Volumes/SDDPCIE2TB/Projects/Z80/vscode/binary-file-viewer/parsers/obj.js');
