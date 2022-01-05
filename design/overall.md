# Overview

# Main design

The SW basically consist of 2 parts:
- the vscode extension code itself
- the webview

The extension is responsible for reading the customer parser files, watch for changes.
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



