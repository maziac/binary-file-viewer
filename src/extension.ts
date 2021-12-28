import * as vscode from 'vscode';
import {CompletionProposalsProvider} from './completionprovider';
import {EditorProvider} from './editorprovider';
import {ParserSelect} from './parserselect';
import {SignatureProvider} from './signatureprovider';
//import {PackageInfo} from './packageinfo';


export function activate(context: vscode.ExtensionContext) {
    // Init package info
    //PackageInfo.Init(context); // TODO : remove

    // Log the extension dir
    console.log(context.extension.id + ' folder: ' + context.extensionPath);

    // Init
    const diagnosticsCollection = ParserSelect.init('/Volumes/SDDPCIE2TB/Projects/Z80/vscode/binary-file-viewer-examples/parsers');
    context.subscriptions.push(diagnosticsCollection);

    /*
    // Register commands.
    context.subscriptions.push(vscode.commands.registerCommand("binary-file-viewer.config.new", () => {
        // Get name and create new file.
    }));
    context.subscriptions.push(vscode.commands.registerCommand("binary-file-viewer.config.list", () => {
        // Lists all configurations
    }));
    context.subscriptions.push(vscode.commands.registerCommand("binary-file-viewer.config.edit", () => {
        // Opens one configuration file for edit
    }));
    context.subscriptions.push(vscode.commands.registerCommand("binary-file-viewer.config.clear", () => {
        // Clears all configs.
    }));
    context.subscriptions.push(vscode.commands.registerCommand("binary-file-viewer.config.export", () => {
        //Exports all configs in a zip file.
    }));
    context.subscriptions.push(vscode.commands.registerCommand("binary-file-viewer.config.import", () => {
        // Import (adds) all configs from a zip.
    }));

*/


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


    // Register
    const completionsProvider = vscode.languages.registerCompletionItemProvider('javascript', new CompletionProposalsProvider(undefined));
    context.subscriptions.push(completionsProvider);


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
    // TODO: DO I need this?
    /*
    const settings = vscode.workspace.getConfiguration('z80-instruction-set');

    // Note: don't add 'language' property, otherwise other extension with similar file pattern may not work.
    // If the identifier is missing it also don't help to define it in package.json. And if "id" would be used it clashes again with other extensions.
    const asmFiles: vscode.DocumentSelector = { scheme: "file", pattern: settings.files};

     // Enable/disable hovering
    if(settings.enableHovering) {
        if(!regHoverProvider) {
            // Register
            regHoverProvider = vscode.languages.registerHoverProvider(asmFiles, new HoverProvider());
            context.subscriptions.push(regHoverProvider);
        }
    }
    else {
        if(regHoverProvider) {
            // Deregister
            regHoverProvider.dispose();
            regHoverProvider = undefined;
        }
    }
    */
}

