import * as vscode from 'vscode';
import {FuncDoc, FunctionDocumentation} from './functiondocs';


/**
 * HoverProvider for assembly language.
 */
export class HoverProvider implements vscode.HoverProvider {
    // The glob patterns to use.
    protected globPatterns: string[];


    /**
     * Constructor.
     * @param globPatterns The glob patterns to use.
     */
    constructor(globPatterns: string[]) {
        // Store
        this.globPatterns = globPatterns;
    }


    /**
     * Called from vscode if the user hovers over a word.
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options
     * @param token
     */
    public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover> {
        // First check for right path
        const docPath = document.uri.fsPath;
        // TODO: check glob pattern


        const line = document.lineAt(position).text;
        const lineTrimmed = line.substring(0, position.character);
        //console.log('HoverProvider : provideHover : lineTrimmed', lineTrimmed);
        const matchStart = /\w*$/.exec(lineTrimmed);
        const lineEnd = line.substring(position.character);
        //console.log('HoverProvider : provideHover : lineEnd', lineEnd);
        const matchEnd = /\w*/.exec(lineEnd);

        // Concatenate hover word
        const label = matchStart[0] + matchEnd[0];
        //console.log('HoverProvider : provideHover : label', label);

        // Search
        const funcDoc = FunctionDocumentation.search(label);
        if (!funcDoc)
            return undefined;

        // Convert to Hover
        const md = this.createHoverMarkdown(funcDoc);
        const hover = new vscode.Hover(md);

        return hover;
    }


    /**
     * Creates the markdown for the hover description.
     * @param funcDoc The function description.
     * @returns A (markdown) string.
     */
    protected createHoverMarkdown(funcDoc: FuncDoc): vscode.MarkdownString {
        // Create label, full signature
        let label = funcDoc.func[0] + '(';
        // Collect all params
        let sep = '';
        for (const param of funcDoc.params) {
            label += sep + param[0] + ': ' + param[1];
            sep = ', ';
        }
        label += ')';
        // Return value
        if (funcDoc.return)
            label += ': ' + funcDoc.return[0];

        // The markdown object
        const md = new vscode.MarkdownString(label, false);

        // Description
        const desc = '*' + funcDoc.func[1] + '*';	// Italic
        md.appendMarkdown('\n\n' + desc);
         if (funcDoc.return && funcDoc.return[1])
            md.appendMarkdown('\n\n@returns ' + funcDoc.return[1]);

        return md;
    }
}
