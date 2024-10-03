
registerFileType((fileExt, filePath, data) => {
	// Check for obj
	fileExt = fileExt.toLowerCase();
	return (fileExt === 'p' || fileExt === 'o' || fileExt === 'p81');
});




// Screen height
const SCREEN_HEIGHT = 192;

// Screen width
const SCREEN_WIDTH = 256;

// The ZX81 ROM charset, 0x1E00-0x1FFF, TODO: get from ROM
const romChars = [
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0xf0, 0xf0, 0xf0, 0xf0, 0x00, 0x00, 0x00, 0x00,
	0x0f, 0x0f, 0x0f, 0x0f, 0x00, 0x00, 0x00, 0x00,
	0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0xf0, 0xf0, 0xf0, 0xf0,
	0xf0, 0xf0, 0xf0, 0xf0, 0xf0, 0xf0, 0xf0, 0xf0,
	0x0f, 0x0f, 0x0f, 0x0f, 0xf0, 0xf0, 0xf0, 0xf0,
	0xff, 0xff, 0xff, 0xff, 0xf0, 0xf0, 0xf0, 0xf0,
	0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55,
	0x00, 0x00, 0x00, 0x00, 0xaa, 0x55, 0xaa, 0x55,
	0xaa, 0x55, 0xaa, 0x55, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x24, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x1c, 0x22, 0x78, 0x20, 0x20, 0x7e, 0x00,
	0x00, 0x08, 0x3e, 0x28, 0x3e, 0x0a, 0x3e, 0x08,
	0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x10, 0x00,
	0x00, 0x3c, 0x42, 0x04, 0x08, 0x00, 0x08, 0x00,
	0x00, 0x04, 0x08, 0x08, 0x08, 0x08, 0x04, 0x00,
	0x00, 0x20, 0x10, 0x10, 0x10, 0x10, 0x20, 0x00,
	0x00, 0x00, 0x10, 0x08, 0x04, 0x08, 0x10, 0x00,
	0x00, 0x00, 0x04, 0x08, 0x10, 0x08, 0x04, 0x00,
	0x00, 0x00, 0x00, 0x3e, 0x00, 0x3e, 0x00, 0x00,
	0x00, 0x00, 0x08, 0x08, 0x3e, 0x08, 0x08, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x3e, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x14, 0x08, 0x3e, 0x08, 0x14, 0x00,
	0x00, 0x00, 0x02, 0x04, 0x08, 0x10, 0x20, 0x00,
	0x00, 0x00, 0x10, 0x00, 0x00, 0x10, 0x10, 0x20,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x08, 0x10,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00,
	0x00, 0x3c, 0x46, 0x4a, 0x52, 0x62, 0x3c, 0x00,
	0x00, 0x18, 0x28, 0x08, 0x08, 0x08, 0x3e, 0x00,
	0x00, 0x3c, 0x42, 0x02, 0x3c, 0x40, 0x7e, 0x00,
	0x00, 0x3c, 0x42, 0x0c, 0x02, 0x42, 0x3c, 0x00,
	0x00, 0x08, 0x18, 0x28, 0x48, 0x7e, 0x08, 0x00,
	0x00, 0x7e, 0x40, 0x7c, 0x02, 0x42, 0x3c, 0x00,
	0x00, 0x3c, 0x40, 0x7c, 0x42, 0x42, 0x3c, 0x00,
	0x00, 0x7e, 0x02, 0x04, 0x08, 0x10, 0x10, 0x00,
	0x00, 0x3c, 0x42, 0x3c, 0x42, 0x42, 0x3c, 0x00,
	0x00, 0x3c, 0x42, 0x42, 0x3e, 0x02, 0x3c, 0x00,
	0x00, 0x3c, 0x42, 0x42, 0x7e, 0x42, 0x42, 0x00,
	0x00, 0x7c, 0x42, 0x7c, 0x42, 0x42, 0x7c, 0x00,
	0x00, 0x3c, 0x42, 0x40, 0x40, 0x42, 0x3c, 0x00,
	0x00, 0x78, 0x44, 0x42, 0x42, 0x44, 0x78, 0x00,
	0x00, 0x7e, 0x40, 0x7c, 0x40, 0x40, 0x7e, 0x00,
	0x00, 0x7e, 0x40, 0x7c, 0x40, 0x40, 0x40, 0x00,
	0x00, 0x3c, 0x42, 0x40, 0x4e, 0x42, 0x3c, 0x00,
	0x00, 0x42, 0x42, 0x7e, 0x42, 0x42, 0x42, 0x00,
	0x00, 0x3e, 0x08, 0x08, 0x08, 0x08, 0x3e, 0x00,
	0x00, 0x02, 0x02, 0x02, 0x42, 0x42, 0x3c, 0x00,
	0x00, 0x44, 0x48, 0x70, 0x48, 0x44, 0x42, 0x00,
	0x00, 0x40, 0x40, 0x40, 0x40, 0x40, 0x7e, 0x00,
	0x00, 0x42, 0x66, 0x5a, 0x42, 0x42, 0x42, 0x00,
	0x00, 0x42, 0x62, 0x52, 0x4a, 0x46, 0x42, 0x00,
	0x00, 0x3c, 0x42, 0x42, 0x42, 0x42, 0x3c, 0x00,
	0x00, 0x7c, 0x42, 0x42, 0x7c, 0x40, 0x40, 0x00,
	0x00, 0x3c, 0x42, 0x42, 0x52, 0x4a, 0x3c, 0x00,
	0x00, 0x7c, 0x42, 0x42, 0x7c, 0x44, 0x42, 0x00,
	0x00, 0x3c, 0x40, 0x3c, 0x02, 0x42, 0x3c, 0x00,
	0x00, 0xfe, 0x10, 0x10, 0x10, 0x10, 0x10, 0x00,
	0x00, 0x42, 0x42, 0x42, 0x42, 0x42, 0x3c, 0x00,
	0x00, 0x42, 0x42, 0x42, 0x42, 0x24, 0x18, 0x00,
	0x00, 0x42, 0x42, 0x42, 0x42, 0x5a, 0x24, 0x00,
	0x00, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x00,
	0x00, 0x82, 0x44, 0x28, 0x10, 0x10, 0x10, 0x00,
	0x00, 0x7e, 0x04, 0x08, 0x10, 0x20, 0x7e, 0x00
];


const BASIC = [
	// 0x0
	"SP", "\u2588", "\u2592", "\u2593", "\u2584", "\u2590", "\u2580", "\u2595", "Ĳ", "\u2596", "¦", "\"", "£", "$", ":", "?",
	// 0x1
	"(", ")", ">", "<", "=", "+", "-", "*", "/", ";", ",", ".", "0", "1", "2", "3",
	// 0x2
	"4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
	// 0x3
	"K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	// 0x4
	"RND", "INKEY$", "PI", "", "", "", "", "", "", "", "", "", "", "", "", "",
	// 0x5
	"", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
	// 0x6
	"", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
	// 0x7
	"UP", "DOWN", "LEFT", "RIGHT", "GRAPHICS", "EDIT", "\n", "RUBOUT", "K/L", "MODE", "FUNCTION", "", "", "", "NUMBER", "CURSOR",
	// 0x8
	"\u2596", "\u2597", "\u2598", "\u2599", "\u259A", "\u259B", "\u259C", "\u259D", "\u259E", "\u259F", "\u25A0", "\u25A1", "\u25A2", "\u25A3", "\u25A4", "\u25A5",
	// 0x9
	"(", ")", ">", "<", "=", "+", "-", "*", "/", ";", ",", ".", "0", "1", "2", "3",
	// 0xA
	"4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
	// 0xB
	"K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	// 0xC
	"\u2033", "AT ", "TAB ", "?", "CODE ", "VAL ", "LEN ", "SIN ", "COS ", "TAN ", "ASN ", "ACS ", "ATN ", "LN ", "EXP ", "INT ",
	// 0xD
	"SQR ", "SGN ", "ABS ", "PEEK ", "USR ", "STR$ ", "CHRS ", "NOT ", "**", " OR ", " AND ", "<=", ">=", "<>", " THEN ", " TO ",
	// 0xE
	" STEP ", " LPRINT ", " LLIST ", " STOP ", " SLOW ", " FAST ", " NEW ", " SCROLL ", " CONT ", " DIM ", " REM ", " FOR ", " GOTO ", " GOSUB ", " INPUT ", " LOAD ",
	// 0xF
	" LIST ", " LET ", " PAUSE ", " NEXT ", " POKE ", " PRINT ", " PLOT ", " RUN ", " SAVE ", " RAND ", " IF ", " CLS ", " UNPLOT ", " CLEAR ", " RETURN ", " COPY "
];

/**
 * Parser for p files (ZX81).
 */
registerParser(() => {

	addStandardHeader();

	setEndianness('little');

	// Get some data
	read(0x400C - 0x4009);	// Skip to D_FILE
	read(2);	// Read dfile
	dfile_ptr = getNumberValue();
	setOffset(0);
	read(0x4010 - 0x4009);	// Skip to VARS
	read(2);	// Read VARS
	vars_ptr = getNumberValue();
	setOffset(0);

	dbgLog('dfile_ptr: ' + dfile_ptr);

	// Starts at $4009
	sysVarsSize = 0x407B + 2 - 0x4009;
	read(sysVarsSize);
	addRow('System Variables ($4009 - $407B)', '', 'Subset of the ZX81 system variables starting at 0x4009.');
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
		addRow('VARS (0x4010)', getHex0xValue(), 'Start of the BASIC variables.');

		read(2);
		addRow('DEST (0x4012)', getHex0xValue(), 'Address of variable in assignment.');

		read(2);
		addRow('E_LINE (0x4014)', getHex0xValue(), 'Contains the line being typed + work space.');

		read(2);
		addRow('CH_ADD (0x4016)', getHex0xValue(), 'Address of the next character to be interpreted: the character after the argument of PEEK, or the NEWLINE at the end of a POKE statement.');

		read(2);
		addRow('X_PTR (0x4018)', getHex0xValue(), 'Address of the character preceding the marker.');

		read(2);
		addRow('STKBOT (0x401A)', getHex0xValue(), 'Bottom of calculator stack.');

		read(2);
		addRow('STKEND (0x401C)', getHex0xValue(), 'Top of calculator stack.');

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

	// BASIC program
	dbgLog('offset1: ', sysVarsSize);
	basicPrgSize = dfile_ptr - 0x4009 - sysVarsSize;
	read(basicPrgSize);
	dbgLog('basicPrgSize: ' + basicPrgSize);

	addRow('BASIC Program');
	addDetails(() => {
		text = getZx81BasicText(basicPrgSize);
		addTextBox(text);
	}, true);

	// DFILE (screen)
	dfileSize = vars_ptr - dfile_ptr;
	dbgLog('DFILE size: ' + dfileSize);
	dbgLog('offset2: ', sysVarsSize + basicPrgSize + dfileSize);
	read(dfileSize);

	addRow('DFILE');
 	addDetails(() => {
		read(dfileSize);
		//addMemDump();
		dfile = getData();
		ctx = addCanvas(SCREEN_WIDTH, 192);
		imgData = ctx.createImageData(SCREEN_WIDTH, 400);
		drawUlaScreen(ctx, imgData, dfile, romChars /*Uint8Array*/, false /*debug*/);
	}, true);

});


// function getDfileSize() {
// 	offs = getOffset();
// 	// Loop through whole dfile
// 	for (k = 0; k < 25; k++) {
// 		readUntil(0x76);
// 	}
// 	// Calculate length
// 	end = getOffset();
// 	count = end - offs;
// 	// Restore
// 	setOffset(offs);
// 	return count;
// }


/** Represents the ZX81 simulated screen.
 */
/** Draws a ZX Spectrum ULA screen into the given canvas.
 * @param ctx The canvas 2d context to draw to.
 * @param imgData A reusable array to create the pixel data in.
 * @param dfile The DFILE data. If undefined, FAST mode is active.
 * @param charset The charset data.
 * @param debug true if debug mode is on. Shows grey background if
 * dfile is not elapsed.
 */
function drawUlaScreen(ctx /*CanvasRenderingContext2D*/, imgData /*ImageData*/, dfile /*Uint8Array*/, charset /*Uint8Array*/, debug /*boolean*/) {
	const pixels = imgData.data;
	let dfileIndex = dfile[0] === 0x76 ? 1 : 0;

	if (debug)
		pixels.fill(128);	// gray background
	else
		pixels.fill(0xFF);	// white background

	// Safety check
	if (!dfile)
		return;

	const width = SCREEN_WIDTH / 8;
	const height = SCREEN_HEIGHT / 8;
	let x = 0;
	let y = 0;

	let fgRed = 0, fgGreen = 0, fgBlue = 0;
	let bgRed = 0xFF, bgGreen = 0xFF, bgBlue = 0xFF;

	while (y < height) {
		const char = dfile[dfileIndex];
		if (x >= width || char === 0x76) {
			x = 0;
			y++;
			dfileIndex++;
			continue;
		};

		const inverted = (char & 0x80) !== 0;
		let charIndex = (char & 0x7f) * 8;
		let pixelIndex = (y * SCREEN_WIDTH + x) * 8 * 4;

		// 8 lines per character
		for (let charY = 0; charY < 8; ++charY) {
			let byte = charset[charIndex];
			if (inverted) byte = byte ^ 0xFF;
			// 8 pixels par line
			for (let charX = 0; charX < 8; ++charX) {
				if (byte & 0x80) {
					// Foreground color
					pixels[pixelIndex++] = fgRed;
					pixels[pixelIndex++] = fgGreen;
					pixels[pixelIndex++] = fgBlue;
					pixels[pixelIndex++] = 0xFF;	// alpha
				}
				else {
					// Background color
					pixels[pixelIndex++] = bgRed;
					pixels[pixelIndex++] = bgGreen;
					pixels[pixelIndex++] = bgBlue;
					pixels[pixelIndex++] = 0xFF;	// alpha
				}
				byte = (byte & 0x7F) << 1;
			}
			// Next line
			pixelIndex += (SCREEN_WIDTH - 8) * 4;
			charIndex++;
		}

		x++;
		dfileIndex++;
	}

	ctx.putImageData(imgData, 0, 0);
}


/** Reads the data of a ZX81 BASIC program and converts
 * it to unicode text.
 * The BASIC format is:
 * SIZE MEANING
 * 2    Line number. Big endian.
 * 2    Length of of following bytes in line (incl $76). little endian.
 * n    The BASIC tokens.
 * 1	0x76 (END token, Newline)
 */
function getZx81BasicText(progLength) {
	let remaining = progLength;
	let txt = '';
	while (remaining > 4) {
		setEndianness('big');
		read(2);	// Line number
		lineNumber = getNumberValue();
		dbgLog('-----------------------');
		dbgLog('Line: ' + lineNumber);
		setEndianness('little');
		txt += lineNumber + ' ';
		read(2);	// Length
		length = getNumberValue();
		if (length > remaining)
			length = remaining;
		// Read tokens
		for(let i = 0; i < length; i++) {
			read(1);
			token = getNumberValue();
			dbgLog('token: ' + token + ', BASIC: ' + BASIC[token]);
			// Check token
			switch (token) {
				case 0x7E:	// Number (is hidden)
					read(5);
					i += 5;
					break;
				default:
					txt += BASIC[token];
			}
		}
		// Next
		remaining -= 4 + length;
	}
	return txt;
}

