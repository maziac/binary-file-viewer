# Changelog

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
