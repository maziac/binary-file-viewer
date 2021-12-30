import * as vscode from 'vscode';
//import * as path from 'path';
import {FuncDoc, FunctionDocumentation} from './functiondocs';
import {ParserSelect} from './parserselect';


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
		// First check for right path
		if (!ParserSelect.isParser(document))
			return undefined;

		const line = document.lineAt(position).text;
		const lineTrimmed = line.substring(0, position.character);
		const len = lineTrimmed.length;

		// Remove hyphens (everything in between ' and ")
		let modLine = '';
		let k = 0;
		while (k < len) {
			const char = lineTrimmed.substring(k, k+1);
			if (char == "'" || char == '"') {
				do {
					k++;
					if (k >= len)
						break;
					const nChar = lineTrimmed.substring(k, k+1);
					if (nChar == char)
						break;
				} while (k < len);
				k++;
				continue;
			}
			modLine += char;
			k++;
		}


		// Search reverse for first unclosed bracket (
		let i = modLine.length - 1;
		let bracketCount = 0;
		while (i >= 0) {
			const char = modLine.substring(i, i+1);
			if (char == '(') {
				if (bracketCount == 0)
					break;
				bracketCount--;
			}
			else if (char == ')') {
				bracketCount++;
			}
			i--;
		}

		// Get the word before the bracket
		const beforeLine = modLine.substring(0, i).trimEnd();	// without bracket
        //console.log('SignatureProvider : provideSignatureHelp : beforeLine', beforeLine);

		// Get the function name
		const matchLast = /[\w.]+$/g.exec(beforeLine);
		if (!matchLast)
			return undefined;
		const funcName = matchLast[0];
        //console.log('SignatureProvider : provideSignatureHelp : funcName', funcName);

		// Get the function document
		const funcDoc = FunctionDocumentation.search(funcName);
		if (!funcDoc)
			return undefined;

		// Get the number of parameters
		const afterLine = modLine.substring(i + 1);
		const countColons = afterLine.split(',').length - 1;
        //console.log('SignatureProvider : provideSignatureHelp : countColons', countColons);
		//console.log('SignatureProvider : --------------------');

		// Create the signature help
		const help = new vscode.SignatureHelp();
		help.activeParameter = countColons;
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
		const label = FunctionDocumentation.getFuncSignature(funcDoc);

		// The markdown object
		const md = new vscode.MarkdownString();

		// Description
		const desc = '*' + funcDoc.func[1] + '*';	// Italic
		md.appendMarkdown(desc);
		if (funcDoc.return && funcDoc.return[1])
			md.appendMarkdown('\n\n@returns ' + funcDoc.return[1]);

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
