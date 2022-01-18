import * as vscode from 'vscode';
import {FunctionDocumentation} from './functiondocs';
import {ParserSelect} from './parserselect';


/**
 * CompletionItemProvider for assembly language.
 */
export class CompletionProvider implements vscode.CompletionItemProvider {

    /**
     * Called from vscode if the user selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param token
     */
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        //console.log('CompletionProvider : ---------------------------');
        //console.log('CompletionProvider : provideCompletionItems');

        // First check for right path
        if (!ParserSelect.isParserDoc(document.uri))
            return undefined;
        //console.log('CompletionProvider : b');

        // Then get text
        //const docPath = document.uri.fsPath;
        const line = document.lineAt(position).text;
        const lineTrimmed = line.substring(0, position.character);
        //console.log('CompletionProvider : provideCompletionItems : lineTrimmed', lineTrimmed);
        const match = /[\w\.]+$/.exec(lineTrimmed);
        if (!match)
            return undefined;
        //console.log('CompletionProvider : c');

        const label = match[0].toLowerCase();
        //console.log('CompletionProvider : d');

        // Search
        const completions = this.search(label);
        //console.log('CompletionProvider : provideCompletionItems : completions', completions.map(val => val.label));

        // Search proposals
        return completions;
    }


    /**
     * Returns all function names that partially match.
     * @param label The name to search for. (lower case)
     * @returns An array with the function names.
     */
    protected search(label: string): vscode.CompletionItem[] {
        const findings: vscode.CompletionItem[] = [];
        for (const [, funcDocs] of FunctionDocumentation.funcDocs) {
            for (const funcDoc of funcDocs) {
                const funcName = funcDoc.func[0];
                const cLabel: vscode.CompletionItemLabel = {
                    label: funcName,
                    description: 'Binary File Viewer'
                };
                if (funcName.toLowerCase().startsWith(label))
                    findings.push({
                        label: cLabel,
                        documentation: funcDoc.func[1],
                        kind: vscode.CompletionItemKind.Function,
                    });
            }
        }
        return findings;
    }

}
