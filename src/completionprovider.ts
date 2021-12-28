import * as vscode from 'vscode';
import {funcDocs} from './functiondocs';


/// All additional completions like Z80 instructions and assembler
/// directives etc.
const completions = [
    // Z80 registers
    'a', 'b', 'c', 'd', 'e', 'h', 'l',
    'af', 'bc', 'de', 'hl', 'ix', 'iy', 'sp',
    'ixl', 'ixh', 'iyl', 'iyh',

    // Z80 instructions
	'adc',  'add',  'and',  'bit',  'call', 'ccf',  'cp',   'cpd',
	'cpdr', 'cpi',  'cpir', 'cpl',  'daa',  'dec',  'di',   'ei',
	'djnz', 'ex',   'exx',  'halt', 'im',   'inc',  'in',   'ind',
	'indr', 'ini',  'inir', 'jp',   'jr',   'ld',   'ldd',  'lddr',
	'ldi',  'ldir', 'neg',  'nop',  'or',   'otdr', 'otir', 'out',
	'outd', 'outi', 'pop',  'push', 'res',  'ret',  'reti', 'retn',
	'rl',   'rla',  'rlc',  'rlca', 'rld',  'rr',   'rra',  'rrc',
	'rrca', 'rrd',  'rst',  'sbc',  'scf',  'set',  'sla',  'slia',
    'sll',  'swap', 'sra',  'srl',  'sub',  'xor',

    // Z80N instructions
    'ldix', 'ldws', 'ldirx', 'lddx', 'lddrx', 'ldpirx',
    'outinb', 'mul', 'swapnib', 'mirror', 'nextreg',
    'pixeldn', 'pixelad', 'setae', 'test',
    'bsla', 'bsra', 'bsrl', 'bsrf', 'brlc',

    // sjasmplus fake instructions
    'sli',

    // sjasmplus
    'macro', 'endm', 'module', 'endmodule', 'struct', 'ends', 'dup', 'edup',
    'if', 'ifn', 'ifdef', 'ifndef', 'ifused', 'ifnused', 'else', 'endif',
    'include', 'incbin',
    'abyte', 'abytec', 'abytez', 'align', 'assert',
    'binary', 'block', 'defb', 'defd', 'defg', 'defh', 'defl', 'defm', 'defs', 'defw', 'dephase', 'disp', 'phase', 'unphase',
    'd24', 'db', 'dc', 'dd', 'dg', 'dh', 'hex', 'dm', 'ds', 'dw', 'dz',
    'display', 'byte', 'word', 'dword',
    'emptytap', 'emptytrd', 'encoding',
    'equ', 'export',
    'end', 'endlua', 'endt', 'ent',
    'includelua', 'inchob', 'inctrd', 'insert',
    'lua', 'labelslist', 'org', 'outend', 'output',
    'memorymap', 'mmu',
    'page', 'rept', 'endr', 'savebin', 'savedev', 'savehob', 'savesna', 'savetrd',
    'savetap', 'basic', 'code', 'numbers', 'chars', 'headless',
    'savenex', 'core', 'cfg', 'cfg3', 'bar', 'palette', 'default', 'mem', 'bmp', 'screen',
    'l2', 'l2_320', 'l2_640', 'scr', 'shc', 'shr', 'tile', 'cooper', 'bank', 'auto',
    'shellexec', 'size', 'slot',
    'tapend', 'tapout',
    'textarea',
    'define', 'undefine',
    'defarray', 'defarray+',
    'device', 'ZXSPECTRUM48', 'ZXSPECTRUM128', 'ZXSPECTRUM256', 'ZXSPECTRUM512', 'ZXSPECTRUM1024', 'ZXSPECTRUM2048', 'ZXSPECTRUM4096', 'ZXSPECTRUM8192', 'ZXSPECTRUMNEXT', 'NONE', 'ramtop',
    'open', 'close',
    'setbp', 'setbreakpoint',
    'bplist', 'unreal', 'zesarux',
    'opt', 'cspectmap', 'fpos',
    '_sjasmplus', '_version', '_release', '_errors', '_warnings'
];


/**
 * CompletionItemProvider for assembly language.
 */
export class CompletionProposalsProvider implements vscode.CompletionItemProvider {

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
     * Called from vscode if the user selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param token
     */
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        // First check for right path
        const docPath = document.uri.fsPath;
        // TODO: check glob pattern


        const line = document.lineAt(position).text;
        const lineTrimmed = line.substring(0, position.character);
        console.log('CompletionProposalsProvider : provideCompletionItems : lineTrimmed', lineTrimmed);
        const match = /[a-zA-z_]\w*$/.exec(lineTrimmed);
        if (!match)
            return undefined;

        const label = match[0].toLowerCase();
        // Minimum length
        if (label.length < 2)
            return undefined;

        // Search
        const findings = this.search(label);

        // Convert to completion list
        const completions: vscode.CompletionItem[] = findings.map(label => {return {label};});

        // Search proposals
        return completions;
    }


    /**
     * Returns all function names that partially match.
     * @param label The name to search for. (lower case)
     * @returns An array with the function names.
     */
    protected search(label: string) {
        const findings: string[] = [];
        for (const funcDoc of funcDocs) {
            const funcName = funcDoc.func[0];
            if (funcName.toLowerCase().startsWith(label))
                findings.push(funcName);
        }
        return findings;
    }

}
