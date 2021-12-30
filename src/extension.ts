import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {CompletionProvider} from './completionprovider';
import {EditorProvider} from './editorprovider';
import {HoverProvider} from './HoverProvider';
import {ParserSelect} from './parserselect';
import {SignatureProvider} from './signatureprovider';
import {PackageInfo} from './packageinfo';
import {HelpView} from './helpview';


// Declare the providers to cahnge them on preferences change.
let completionsProvider: CompletionProvider;


export function activate(context: vscode.ExtensionContext) {
    // Init package info
    PackageInfo.init(context);

    // Log the extension dir
    console.log(context.extension.id + ' folder: ' + context.extensionPath);

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
    const hoverProvider = vscode.languages.registerHoverProvider('javascript', new HoverProvider(undefined));
    context.subscriptions.push(hoverProvider);

    // Command to show the help
    context.subscriptions.push(vscode.commands.registerCommand('binary-file-viewer.help', () => {
        const helpView = HelpView.getHelpView();
        // Make sure the view is visible
        helpView.reveal();
    }));


    // Command to open a file
    context.subscriptions.push(vscode.commands.registerCommand('binary-file-viewer.open', uri => {
        // Get the parser contents
        const filePath = uri.fsPath;
        let fileExt = path.extname(filePath);
        if (fileExt.length >= 1)
            fileExt = fileExt.slice(1); 	// Remove the '.'
        const parser = ParserSelect.selectParserFile(fileExt, filePath, undefined);
        if (!parser) {
            // Get all tried parsers.
            let msg = "Binary-File-Viewer: No parser available for '" + path.basename(filePath) + "'.\n";
            const parserPaths = ParserSelect.getParserFilePaths();
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
 * @returns An array with paths that point to a directory. All other paths are eliminated.
 * For the wrong paths an error message is shown.
 */
function getParserPaths() {
    const settings = PackageInfo.configuration();
    const parserFolders = settings.get<string[]>('parserFolders');
    const correctFolders: string[] = [];
    for (const folder of parserFolders) {
         // Check that path exists
        const exists = fs.existsSync(folder);
        if (!exists) {
            vscode.window.showErrorMessage("Settings: The path '" + folder + "' does not exist.");
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