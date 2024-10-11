# Overview

# Main design

The SW basically consist of 2 parts:
- the vscode extension code itself
- the webview

The extension is responsible for reading the customer parser files, watching for changes.
When a file should be shown a new webView is opened.
The right parser file is selected and the parser file's content is sent to the webView.


# Custom Parser Files

The custom parser file folders are configurable in the preferences. Several folders can be set.
There is a file watcher that checks for new/changed files and reads them.

The parser files are executed in a safe environment ('vmRunInNewContext') so that they can't do any harm.

The files are read in when saved by the 'ParserSelect' static class.
It does a first check by executing them to find any errors and to report to the user in the 'PROBLEMS' area of vscode.

The files contain 2 major sections.
- registerFileType
- registerParser


## registerFileType

'registerFileType' allows the user to install his own function to chek if the file is the right file to be parsed.
Whenever the user selects a binary file in vscode's file explorer this function is called and should return 'true' if the file can be parsed.

If more than 1 registered function returns true an error is reproted and the first one is used.

The function registered by registerFileType is executed by the extension.

The extension itself registers for all file types (\*.*) but priority is "option". I.e. it is not used as default extension unless the user configures vscode to do so.

## registerParser

'registerParser' is executed by the main parser inside the webview.
If an error occurs it is reported back to the extension which presents it in the PROBLEM area.

Otherwise the given function (provided by the user) will setup the visualization of the bin file by calling the parser's API functions..


# Creation of the DOM

Each invocation of 'addRow' adds another node to the Dom object.
In fact everything is a large table and 'addRow' adds another row to it.
When 'addDetails' is called this also adds another row and the previous row gets a collapsible icon (+).
The just added row gets another embedded table. The current row is remembered and restored after the 'addDetails' block.


# Filewatcher

The js files have been observed for changes in the past. Version 1.0.0 used the nsfw filewatcher which was working fine but was a binary package. I.e. it included only the macOS binary.
Therefore on Windows it was not working.

In order to support also windows the nsfw was dropped beginning with version 1.1.0 and instead the vscode API was used.
Unfortunately this API is not able to watch for changes in directories that are not included in the workspace folders, i.e. in one vscode window.
Therefore the js files are only checked for changes when they are opened inside the vscode itself. And only in the same vscode window.
I.e. during development of the parser js file it is still possible to work side-by-side with the parser and the binary file.
But in normal operation (when the parser js files are not open or open in another vscode window) there will be no update of the binary file view if the parser changes.

Therefore, whenever a binary file is opened all parser files are re-read from the file system because they might have changed meanwhile.
The file view also has a 'reload' button to manually initiate a reload.


# Use of the VM
The user's code is executed in a vm.
In js there are several option to exeute code:
- eval
- new Function
- vm.runInThisContext()
- vm.runInNewContext()

| Function              | global | 'var' | 'let' |
| :-------------------- | :----- | :---- | :---- |
| eval                  | yes    | yes   | yes   |
| new Function          | yes    | no    | no    |
| vm.runInThisContext() | yes    | no    | no    |
| vm.runInNewContext()  | no     | no    | no    |

('var' and 'let': both are local variables.)
In general the vm function are a bit slower (in my measurements 25% slower).

Example, https://stackoverflow.com/questions/39416716/what-is-the-difference-between-new-function-and-vm#:~:text=Both%20can%20be%20restricted%20to,the%20same%20context%20using%20parameters:
~~~js
const vm = require('vm');

globalName    = 'global';
var localName = 'local';

function code(prefix) {
  return `console.log("${prefix}:", typeof globalName, typeof localName)`;
}

eval(code('eval'));

new Function(code('function'))();

vm.runInThisContext(code('vm, this ctx'));
vm.runInNewContext(code('vm, new ctx'));
~~~

Its output:
~~~
eval: string string
function: string undefined
vm, this ctx: string undefined
evalmachine.<anonymous>:1
console.log("vm, new ctx:", typeof globalName, typeof localName)
^

ReferenceError: console is not defined
~~~

vm:
- runInThisContext() uses the existing context. This means that, inside the script that is run, the same global object and the same set of JS language builtins is used.
- runInContext() uses a different context. The global object is different from the “main” Node.js global object, and there will be a different set of JS language builtins. This includes the fact that no Node.js APIs are available.


## Variable scopes
- ```a = 0;``` The code above gives a global scope variable
- ```var a = 0;``` This code will give a variable to be used in the current scope, and under it (i.e. var is also local, but not block scope)
- ```let a = 0;``` local variable in block scope


# Web and Node environment
Node.js:
The function in 'registerFileType' is run in the vm.runInNewContext().
Also the "global" code around both register functions.
The 'registerParser' is not executed.
I.e. the code is executed only to check the file extension.
I use vm.runInNewContext() here because 'new Function()' does not return the lines in case of errors.

Web:
The function in 'registerParser' is executed in the webserver context.
Here 'new Function()' is used.
This uses "with(context) { ... }" to set the context.
As context all file-parser functions are passed and a few global namespaces and functions:
- file-parser functions:
  - addStandardHeader
  - read
  - ...
  - endOfFile
- global:
  - Math
  - Date
  - String
  - Number
  - BigInt
  - Array
  - ArrayBuffer
	- DataView
	- Object
	- JSON
	- atob(), btoa()

Note: functions atob, btoa have to be wrapped in an arrow function. The reason is unknown to me.

Important:
Because 'registerFileType' is called in node environment and 'registerParser' in webkit environment, the context do not have to overlap.
But this also has a few implications on global variables (or variables defined outside or the register functions):
- global variables set in registerFileType cannot be passed to the registerParser function.
The context that node.js uses is thrown away after the file type was checked.
- If a global variable would use something from the context that is not available in the other context an error will be thrown. E.g.
~~~js
let s = atob("zzz");
registerParser(...);
~~~
Here the web browser environment would work, but it does not pass the node js environment.
Note: I could define those namespaces and functions also in the node.js context. They are anyway probably not used in registerFileType. But I omit this work as the use case for defining outside the register functions is very limited and probably no problem in the real world.
