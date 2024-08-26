# Changelog

# 1.10.0
- registerParser: the parser you register now has as parameter the file path of the file to be decoded.

# 1.9.0
- Added support for Object, Array, Map, JSON, atob and btoa (#14)
- Added 'getRemainingSize()' method (#15)
- Fixed #17: Zoom

# 1.8.0
- Added support to read floating point numbers according IEEE754: getFloatNumberValue(). single (4 byte) and double (8 byte) precision is supported.

# 1.7.3
- Allow for relative paths in 'parserFolders'. The workspace folder is added to the relative path. (#10)

# 1.7.2
- Improved error logging if "read(NaN)" is used.

# 1.7.1
- Fixed unreachable functions (esbuild).

# 1.7.0
- Changed to esbuild. Decreased size.

# 1.6.0
- Added functonality to change/get the file offset:
	- setOffset():	Set the absolute file offset.
	- getOffset(): Get the absolute file offset (e.g. to restore it later).
	- read(): Now also allows for negative size. with this 'read' can be used to relatively move the file offset forward or backward.

# 1.5.0
- 2 new API functions:
	- getSignedNumberValue(): As getNumberValue() but interprets the value as signed int.
	- getSignedDecimalValue(): As getDecimalValue() but interprets the value as signed int.
	- Both commands returns a string (e.g. "-1234") and add a hex hover.
- Functions returning a string are accurate now, no matter how big the number is.

# 1.4.1
- Parser path explanation added to the help page.

# 1.4.0
- New API commands:
	- endOfFile: returns true if end of file reached.

# 1.3.0
- New API commands:
	- dbgStop: Stops execution of the parser.
	- dbgLog: Logs to the OUTPUT pane.
	- dbgOverrideDetailsOpen: Override temporarily the initial open state for 'detail' commands.
	- setRowValue: Sets a value in the current row (for special cases).
- Automatic hovers for 'Value' cells if getDecimalValue, getHex*Value or getBitsValue is used. Depending on the chosen type the different format for displaying the hover value is selected.
- Additionally also custom (value) hover texts are possible.

# 1.2.0
- New API function: 'readRowWithDetails' for cases where the size of a row is not known in advance.
- Improved display of bit ranges (e.g. ".7-4") in the 'size' column.
- Fixed readBits byte offset calculation.
- Fixed: sub directories in parser folders are now correctly searched.
- Added 'description' to completion item labels.

# 1.1.0
- nfsw removed. Using vscode API instead. With this Windows and Linux will be supported as well.
- 'Reload' button added.

# 1.0.1
- Readme: Comment added that the extension can only be used on macOS at the moment.

# 1.0.0
- First version for the marketplace.

# 0.1.0
- Initial version.
