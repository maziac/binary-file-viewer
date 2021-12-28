import * as vscode from 'vscode';
import {CompletionProvider} from './completionprovider';
import {EditorProvider} from './editorprovider';
import {HoverProvider} from './HoverProvider';
import {ParserSelect} from './parserselect';
import {SignatureProvider} from './signatureprovider';
//import {PackageInfo} from './packageinfo';


// Declare the providers to cahnge them on preferences change.
let completionsProvider: CompletionProvider;


export function activate(context: vscode.ExtensionContext) {
    // Init package info
    //PackageInfo.Init(context); // TODO : remove

    // Log the extension dir
    console.log(context.extension.id + ' folder: ' + context.extensionPath);

    // Init
    context.subscriptions.push(ParserSelect.diagnosticsCollection);

    // Get settings
    const settings = vscode.workspace.getConfiguration('binary-file-viewer');
    const parserFolders = settings.get<string[]>('parserFolders');

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
    completionsProvider.folders = parserFolders;
    const regCompletionsProvider = vscode.languages.registerCompletionItemProvider('javascript', completionsProvider);
    context.subscriptions.push(regCompletionsProvider);

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider('javascript', new HoverProvider(undefined));
    context.subscriptions.push(hoverProvider);

    // Read configuration
    configure(context);

    // Check for every change.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        configure(context, event);
    }));
}


/**
 * Reads the configuration.
 */
function configure(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
    const settings = vscode.workspace.getConfiguration('binary-file-viewer');

    if (event) {
        if (event.affectsConfiguration('binary-file-viewer.parserFolders')) {
            // Reconfigure all providers
            const parserFolders = settings.get<string[]>('parserFolders');
            console.log('configure : parserFolders', parserFolders);
            completionsProvider.folders = parserFolders;
            // Restart file watcher
            ParserSelect.init(parserFolders);
        }
    }
}

