registerFileType((fileExt, filePath, data) => {
	// Check for obj
	return (fileExt === 'p' || fileExt === 'o' || fileExt === 'p81');
});


/**
 * Parser for p files (ZX81).
 */
registerParser(() => {

	addStandardHeader();

	// Starts at $4009
	read(0x407B + 2 - 0x4009);
	addRow('System Variables ($4009 - $407B)');
	addDetails(() => {
		read(1);
		addRow('VERSN (0x4009)', getDecimalValue(), '8k ROM version.');

		read(2);
		addRow('E_PPC (0x400A)', getHex0xValue(), 'Number of current line.');

		read(2);
		addRow('D_FILE (0x400C)', getHex0xValue(), 'pointer to the DFILE (screen memory).');

		read(2);
		addRow('DF_CC (0x400E)', getHex0xValue(), 'Address of PRINT position in display file. Can be poked so that PRINT output is sent elsewhere.');

		read(2);
		addRow('VARS (0x4010)', getHex0xValue(), 'See chapter 27.');

		read(2);
		addRow('DEST (0x4012)', getHex0xValue(), 'Address of variable in assignment.');

		read(2);
		addRow('E_LINE (0x4014)', getHex0xValue(), 'See chapter 27.');

		read(2);
		addRow('CH_ADD (0x4016)', getHex0xValue(), 'Address of the next character to be interpreted: the character after the argument of PEEK, or the NEWLINE at the end of a POKE statement.');

		read(2);
		addRow('X_PTR (0x4018)', getHex0xValue(), 'Address of the character preceding the marker.');

		read(2);
		addRow('STKBOT (0x401A)', getHex0xValue(), 'See chapter 27.');

		read(2);
		addRow('STKEND (0x401C)', getHex0xValue(), 'See chapter 27.');

		read(1);
		addRow('BERG (0x401E)', getHex0xValue(), 'Calculator\'s b register.');

		read(2);
		addRow('MEM (0x401F)', getHex0xValue(), 'Address of area used for calculator\'s memory.');

		read(1);
		addRow('not used (0x4021)', getHex0xValue(), '');

		read(1);
		addRow('DF_SZ (0x4022)', getDecimalValue(), 'The number of lines (including one blank line) in the lower part of the screen.');

		read(2);
		addRow('S_TOP (0x4023)', getHex0xValue(), 'The number of the top program line in automatic listings.');

		read(2);
		addRow('LAST_K (0x4025)', getHex0xValue(), 'Shows which keys pressed.');

		read(1);
		addRow('(0x4027)', getHex0xValue(), 'Debounce status of keyboard.');

		read(1);
		addRow('MARGIN (0x4028)', getDecimalValue(), 'Number of blank lines above or below picture: 55 in Britain, 31 in America.');

		read(2);
		addRow('NXTLIN (0x4029)', getHex0xValue(), 'Address of next program line to be executed.');

		read(2);
		addRow('OLDPPC (0x402B)', getHex0xValue(), 'Line number of which CONT jumps.');

		read(1);
		addRow('FLAGX (0x402D)', getHex0xValue(), 'Various flags.');

		read(2);
		addRow('STRLEN (0x402E)', getHex0xValue(), 'Length of string type destination in assignment.');

		read(2);
		addRow('T_ADDR (0x4030)', getHex0xValue(), 'Address of next item in syntax table (very unlikely to be useful).');

		read(2);
		addRow('SEED (0x4032)', getHex0xValue(), 'The seed for RND. This is the variable that is set by RAND.');

		read(2);
		addRow('FRAMES (0x4034)', getHex0xValue(), 'Counts the frames displayed on the television. Bit 15 is 1. Bits 0 to 14 are decremented for each frame set to the television.');

		read(1);
		addRow('COORDS (0x4036)', getDecimalValue(), 'x-coordinate of last point PLOTted.');

		read(1);
		addRow('(0x4037)', getDecimalValue(), 'y-coordinate of last point PLOTted.');

		read(1);
		addRow('PR_CC (0x4038)', getHex0xValue(), 'Less significant byte of address of next position for LPRINT to print as (in PRBUFF).');

		read(1);
		addRow('S_POSN (0x4039)', getDecimalValue(), 'Column number for PRINT position.');

		read(1);
		addRow('(0x403A)', getDecimalValue(), 'Line number for PRINT position.');

		read(1);
		addRow('CDFLAG (0x403B)', getHex0xValue(), 'Various flags. Bit 7 is on (1) during compute & display mode.');

		read(33);
		addRow('PRBUFF (0x403C)', '', 'Printer buffer (33rd character is NEWLINE).');
		addDetails(() => {
			read(33);
			addMemDump();
		});

		read(30);
		addRow('MEMBOT (0x405D)', '', 'Calculator\'s memory area; used to store numbers that cannot conveniently be put on the calculator stack.');
		addDetails(() => {
			read(30);
			addMemDump();
		});

		read(2);
		addRow('not used (0x407B)', getHex0xValue(), '');
	});

});
