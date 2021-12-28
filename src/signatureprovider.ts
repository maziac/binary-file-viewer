import * as vscode from 'vscode';
import * as path from 'path';
import {FuncDoc, FunctionDocumentation} from './functiondocs';


/**
 * Provider for the function signature.
 * I.e. the help text that appears when a '(' or a ',' is typed.
 */
export class SignatureProvider implements vscode.SignatureHelpProvider {

	/**
	 * Provide help for the signature at the given position and document.
	 * @param document The document in which the command was invoked.
	 * @param position The position at which the command was invoked.
	 * @param token A cancellation token.
	 * @param context Information about how signature help was triggered.
	 * @return Signature help or a thenable that resolves to such. The lack of a result can be
	 * signaled by returning `undefined` or `null`.
	 */
	provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
		//console.log('SignatureProvider : provideSignatureHelp : document', document)

		const line = document.lineAt(position).text;
		const lineTrimmed = line.substring(0, position.character);
		const matchLast = /(\w+\s*\([^(]*$)/g.exec(lineTrimmed);
		if (!matchLast)
			return undefined;
		const funcParams = matchLast[1];
		const match = /([a-zA-Z_][\w]*)/.exec(funcParams);
		if (!match)
			return undefined;
		const funcName = match[1];
		//console.log('SignatureProvider : provideSignatureHelp : funcName', funcName)

		// Get the function document
		const funcDoc = FunctionDocumentation.search(funcName);
		if (!funcDoc)
			return undefined;

		const help = new vscode.SignatureHelp();
		// Count the number of parameters to get the right one
		let remHyphes = funcParams.replace(/'.*?('|$)/g, "''");
		remHyphes = remHyphes.replace(/".*?("|$)/g, '""');
		help.activeParameter = remHyphes.split(',').length - 1;
		help.activeSignature = 0;
		help.signatures = [
			this.createSignatureInfo(funcDoc)
		];

		return help;
	}


	/**
	 * Creates a vscode.SignatureInformation from the function description.
	 * @param funcDoc The function description.
	 * @returns A SignatureInformation for vscode.
	 */
	protected createSignatureInfo(funcDoc: FuncDoc): vscode.SignatureInformation {
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

		// Description
		const desc = '*'+funcDoc.func[1]+'*';	// Italic
		const md = new vscode.MarkdownString(desc, false);
		if (funcDoc.return && funcDoc.return[1])
			md.appendMarkdown( '\n\n@returns ' + funcDoc.return[1]);

		// Create signature info
		const info = new vscode.SignatureInformation(label, md);

		// Parameter info
		if (funcDoc.params) {
			for (const param of funcDoc.params) {
				const paramInfo = new vscode.ParameterInformation(param[0], new vscode.MarkdownString(param[2]));
				info.parameters.push(paramInfo);
			}
		}

		return info;
	}

}
