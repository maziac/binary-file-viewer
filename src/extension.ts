import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {CompletionProvider} from './completionprovider';
import {EditorProvider} from './editorprovider';
import {HoverProvider} from './hoverprovider';
import {ParserSelect} from './parserselect';
import {SignatureProvider} from './signatureprovider';
import {PackageInfo} from './packageinfo';
import {HelpView} from './helpview';


// Declare the providers to change them on preferences change.
let completionsProvider: CompletionProvider;


export function activate(context: vscode.ExtensionContext) {
    // Init package info
    PackageInfo.init(context);

    // Log the extension dir
    //console.log(context.extension.id + ' folder: ' + context.extensionPath);

    // Init
    context.subscriptions.push(ParserSelect.diagnosticsCollection);

    // Get settings
    const parserFolders = getParserPaths();

    // Watch for the folders
    ParserSelect.init(parserFolders);

    // Register custom readonly editor provider
    const viewProvider = new EditorProvider();
    vscode.window.registerCustomEditorProvider('binary-file-viewer.viewer', viewProvider, {webviewOptions: {enableFindWidget: true, retainContextWhenHidden: true}});


    // Register signature help provider (Provides help for the API functions)
    const signatureProvider = new SignatureProvider();
    const signatureMetaData: vscode.SignatureHelpProviderMetadata = {
        retriggerCharacters: [],
        triggerCharacters: ['(', ',']
    };
    vscode.languages.registerSignatureHelpProvider('javascript', signatureProvider, signatureMetaData);


    // Register completion provider
    completionsProvider = new CompletionProvider();
    const regCompletionsProvider = vscode.languages.registerCompletionItemProvider('javascript', completionsProvider);
    context.subscriptions.push(regCompletionsProvider);

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider('javascript', new HoverProvider());
    context.subscriptions.push(hoverProvider);

    // Command to show the help
    context.subscriptions.push(vscode.commands.registerCommand('binary-file-viewer.help', () => {
        const helpView = HelpView.getHelpView();
        // Make sure the view is visible
        helpView.reveal();
    }));


    // Command to open a file
    context.subscriptions.push(vscode.commands.registerCommand('binary-file-viewer.open', uri => {
        // Select the parser
        const filePath = uri.fsPath;
        const parser = ParserSelect.getAllParserFile(filePath);
        if (!parser) {
            // Get all tried parsers.
            let msg = "Binary-File-Viewer: No parser available for '" + path.basename(filePath) + "'.\n";
            const parserPaths = ParserSelect.getTestedParserFilePaths();
            if (parserPaths.length > 0) {
                msg += "Tried parser(s): ";
                for (const parserPath of parserPaths)
                    msg += '\n' + parserPath;
            }
            vscode.window.showErrorMessage(msg);
            return;
        }

        // Open document
        vscode.commands.executeCommand('vscode.openWith', uri, 'binary-file-viewer.viewer');
    }));

    // Register for text document changes.
    vscode.workspace.onDidSaveTextDocument((doc: vscode.TextDocument) => {
        //ParserSelect.textDocModified(doc);
        ParserSelect.updateIfParserFile([doc.uri]);
    });
    vscode.workspace.onDidDeleteFiles((e: vscode.FileDeleteEvent) => {
        //ParserSelect.textDocsDeleted(e.files);
        ParserSelect.updateIfParserFile(e.files);
    });
    vscode.workspace.onDidCreateFiles((e: vscode.FileCreateEvent) => {
        //ParserSelect.textDocsCreated(e.files);
        ParserSelect.updateIfParserFile(e.files);
    });
    vscode.workspace.onDidRenameFiles((e: vscode.FileRenameEvent) => {
        //ParserSelect.textDocsRenamed(e.files);
        // Merge old and new names
        const merged: vscode.Uri[] = [];
        for (const renamedFile of e.files) {
            merged.push(renamedFile.newUri);
            merged.push(renamedFile.oldUri);
        }
        ParserSelect.updateIfParserFile(merged);
    });

    // Check for every change.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        configure(context, event);
    }));
}


/**
 * Reads the configuration.
 */
function configure(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
    if (event) {
        if (event.affectsConfiguration('binary-file-viewer.parserFolders')) {
            // Reconfigure all providers
            const parserFolders = getParserPaths();
            // Restart file watcher
            ParserSelect.init(parserFolders);
        }
    }
}


/**
 * Checks the folder path of the configuration.
 * @returns An array with paths that points to a directory. All other paths are eliminated.
 * For the wrong paths an error message is shown.
 */
function getParserPaths() {
    // Add main settings
    const cfg = PackageInfo.configuration();

    // Now check all parserFolders settings
    const correctFolders: string[] = [];
    const parserFolders = cfg.get<string[]>('parserFolders') ?? [];

    // Add workspace folders to all relative paths
    const consolidatedParserFolders: string[] = [];
    const wsFolders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of parserFolders) {
        if (path.isAbsolute(folder)) {
            if (!consolidatedParserFolders.includes(folder)) {
                // Check that path exists (only for absolute paths)
                const exists = fs.existsSync(folder);
                if (!exists) {
                    vscode.window.showErrorMessage("Settings: The path '" + folder + "' does not exist.");
                    continue;
                }
                consolidatedParserFolders.push(folder);
            }
        }
        else {
            // Create an absolute path for each workspace folder
            for (const wsFolder of wsFolders) {
                const absPath = path.join(wsFolder.uri.fsPath, folder);
                if (!consolidatedParserFolders.includes(absPath))
                    consolidatedParserFolders.push(absPath);
            }
        }
    }

    // Give the relative paths a higher priority
    for (const folder of consolidatedParserFolders) {
        // Check that path exists
        const exists = fs.existsSync(folder);
        if (!exists) {
            // Silently skip (a check for the absolute paths is done in the step before)
            continue;
        }
        // Check that path is a directory
        const isDir = fs.lstatSync(folder).isDirectory();
        if (!isDir) {
            vscode.window.showErrorMessage("Settings: The path '" + folder + "' is not a directory.");
            continue;
        }
        // Everything ok: add to array
        correctFolders.push(folder);
    }
    return correctFolders;
}
