# Overview

# Main design

The SW basically consist of 2 parts:
- the vscode extension code itself
- the webview

The extension is responsible for reading the customer parser files, watch for changes.
When a file should be shown a new webView is opened.
The right parser file is selected and the parser file's content is sent to the webView.


# Custom Parser Files

The custom parser files are held in the extensions './parsers' directory.
There is a file watcher that checks for new/changed files and reads them.

The parser files are executed in a safe environment so that they can't do any harm.

The files are read in when saved by the 'ParserSelect' static class.
It does a first check by executing them to find any errors and report to the user in the 'PROBLEMS' area of vscode.

The files contain 2 major sections.
- registerFileType
- registerParser


## registerFileType

'registerFileType' allows the user to install his own function to if the file is the right file to be parsed.
Whenever the user selects a binary file in vscode's file explorer this function is called and should return 'true' if the file can be parsed.

If more than 1 registered function returns true the user is asked which parser to use.

The function registered by registerFileType is executed by the extension.


## registerParser

'registerParser' is executed by the main parser. After execution the registered function is immediately called to use the parser code.

The function registered by registerParser is executed by the webView.


# Creation of the DOM

Each invocation of 'addRow' adds another node to the Dom object.
In fact everything is a large table and 'addRow' adds another row to it.
Some of the last set cells are remembered until the next row so that the user can add more contents.
I.e. hover information.
When 'addDetails' is called this also adds another row and the previous row gets a collapsible icon (+).
The just added row gets another embedded table.


