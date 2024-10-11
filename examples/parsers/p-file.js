
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

/** The ZX82 charset and tokens.
 * For the graphics codes and the inverse characters the coding
 * of ZXText2P has been used.
 * See https://freestuff.grok.co.uk/zxtext2p/index.html
 * To be able to reconstruct machine code in REM statements the ZX81 charser codes
 * without character are put as a number in square brackets.
 * The codes that correspondent to commands like "GOTO" are also but in brackets,
 * e.g. "[GOTO]".
 * Same as done for these codes when they appear in quoted text.
 */
const BASIC = [
	// 0x0
	" ", "\\' ", "\\ '", "\\''", "\\. ", "\\: ", "\\.'", "\\:'", "\\##", "\\,,", "\\~~", "\"", "#", "$", ":", "?",
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
	//"UP", "DOWN", "LEFT", "RIGHT", "GRAPHICS", "EDIT", "NEWLINE", "RUBOUT", "K/L", "MODE", "FUNCTION", "", "", "", "NUMBER", "CURSOR",
	"", "", "", "", "", "", ""/*NL*/, "", "", "", "", "", "", "", "", "",
	// 0x8 Inverse graphics
	"\\::", "\\.:", "\\:.", "\\..", "\\':", "\\ :", "\\'.", "\\ .", "\@@", "\\;;", "\\!!", "\"", "#", "$", ":", "?",
	// 0x9 Inverse
	"(", ")", ">", "<", "=", "+", "-", "*", "/", ";", ",", ".", "0", "1", "2", "3",
	// 0xA Inverse
	"4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
	// 0xB Inverse
	"K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	// 0xC
	"\\\"", "AT ", "TAB ", "", "CODE ", "VAL ", "LEN ", "SIN ", "COS ", "TAN ", "ASN ", "ACS ", "ATN ", "LN ", "EXP ", "INT ",
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

	// E_LINE (end of BASIC program and vars)
	read(0x4014 - 0x4009);	// Skip to E_LINE
	read(2);	// Read E_LINE
	eline_ptr = getNumberValue();
	setOffset(0);

	// Next line in basic program:
	read(0x4029 - 0x4009);	// Skip to NXTLIN
	read(2);	// Read NXTLIN
	nxtlin = getNumberValue();
	setOffset(0);
	// Get BASIC line number from address
	read(nxtlin - 0x4009);
	read(2);	// Read line number
	if (nxtlin !== dfile_ptr) {
		setEndianness('big');
		nextBasicLine = getNumberValue();
		setEndianness('little');
	}
	setOffset(0);


	dbgLog('dfile_ptr: ' + dfile_ptr);

	// Starts at $4009
	sysVarsSize = 0x407B + 2 - 0x4009;
	read(sysVarsSize);
	addRow('System Variables $4009 - $407D', '', 'ZX81 system variables.');
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
		addRow('E_LINE (0x4014)', getHex0xValue(), 'Contains the line being typed + work space. (End of VARS area.)');

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
		addRow('PRBUFF (0x403C)', '', 'Printer buffer (33 bytes).');
		addDetails(() => {
			read(33);
			addMemDump();
		});

		read(30);
		addRow('MEMBOT (0x405D)', '', 'Calculator\'s memory area; used to store numbers that cannot conveniently be put on the calculator stack. (30 bytes)');
		addDetails(() => {
			read(30);
			addMemDump();
		});

		read(2);
		addRow('not used (0x407B)', getHex0xValue(), '');
	});

	// BASIC program (starts at $407D)
	dbgLog('offset1: ', sysVarsSize);
	basicPrgSize = dfile_ptr - 0x4009 - sysVarsSize;
	dbgLog('basicPrgSize: ' + basicPrgSize);

	if (nextBasicLine === undefined) {
		// Program is stopped
		prgComment = 'The program is stopped.';
	}
	else {
		// Program continues
		prgComment = 'The program continues at line ' + nextBasicLine + '.';
		if (nxtlin < 0x407D || nxtlin >= dfile_ptr)
			prgComment += ' The line is at $' + toHex(nxtlin) + ' outside the BASIC program area.';
	}

	read(basicPrgSize);
	addRow('BASIC Program $407D - $' + toHex(dfile_ptr), '', prgComment);

	addDetails(() => {
		//read(basicPrgSize)
		//addMemDump();
		text = getZx81BasicText(basicPrgSize);
		addTextBox(text);
	}, true);

	// DFILE (screen)
	dfileSize = vars_ptr - dfile_ptr;
	dbgLog('DFILE size: ' + dfileSize);
	dbgLog('offset2: ', sysVarsSize + basicPrgSize + dfileSize);
	read(dfileSize);

	dfileComment = 'ZX81 screen display ';
	dfileComment += (dfileSize === 24*33+1) ? '(expanded).' : '(collapsed).';
	addRow('DFILE $' + toHex(dfile_ptr) + ' - $' + toHex(vars_ptr), '', dfileComment);
 	addDetails(() => {
		read(dfileSize);
		//addMemDump();
		dfile = getData();
		ctx = addCanvas(SCREEN_WIDTH, 192);
		imgData = ctx.createImageData(SCREEN_WIDTH, 400);
		drawUlaScreen(ctx, imgData, dfile, romChars /*Uint8Array*/, false /*debug*/);
	}, false);

	// VARS
	varsSize = eline_ptr - vars_ptr;
	dbgLog('VARS size: ' + varsSize);
	read(varsSize);

	addRow('VARS $' + toHex(vars_ptr) + ' - $' + toHex(eline_ptr), '', 'ZX81 BASIC variables.');
	addDetails(() => {
		read(varsSize);
		addMemDump();
	}, false);
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


/** Returns a hex string for a number.
 * Without $ or 0x.
 */
function toHex(val, len = 4) {
	return val.toString(16).toUpperCase().padStart(len, '0')
}

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

	// Show all ZX81 characters:
	// for (let i = 0; i < 256; i++) {
	// 	cvt = convertToken(i);
	// 	txt += 'i=' + i.toString().padStart(3) + ' (' + toHex(i, 2) + '), token: ' + i.toString().padStart(3) + ', BASIC: ' + cvt + '\n';
	// }
	//return txt;

	while (remaining > 4) {
		setEndianness('big');
		read(2);	// Line number
		lineNumber = getNumberValue();
		//dbgLog('-----------------------');
		//dbgLog('Line: ' + lineNumber);
		setEndianness('little');
		txt += lineNumber.toString().padStart(4) + ' ';
		read(2);	// Length
		length = getNumberValue();
		if (length > remaining)
			length = remaining;
		// Read tokens
		let rem = false;
		let quoted = false;
		for(let i = 0; i < length - 1; i++) {
			read(1);
			token = getNumberValue();
			//dbgLog('i=' + i.toString().padStart(3) + ', token: ' + token + ', BASIC: ' + BASIC[token]);

			// Number?
			if (!rem && !quoted && token === 0x7E) {	// Number (is hidden)
				read(5);	// Skip floating point representation
				i += 5;
			}
			else {
				// Get token
				let cvt = convertToken(token);
				// For commands skip left space
				if (token >= 0xE1)
					cvt = cvt.trimStart();
				// If REM or quoted then add brackets to commands
				if ((rem || quoted) && ((token >= 0xC1 && token !== 0xC3) || (token >= 0x40 && token <= 0x42)))
					cvt = '[' + cvt.trim() + ']';
				txt += cvt;
			}

			// Check for REM
			if (i === 0 && token === 0xEA) {
				rem = true;
			}
			// Check for quoted text
			else if(token === 0x0B) {
				quoted = !quoted;
			}
		}
		// Read newline
		read(1);
		// Next
		remaining -= 4 + length;
		txt += '\n';
	}
	return txt;
}


/** Converts one ZX81 character/token into text. */
function convertToken(token) {
	let txt = '';
	// Negativ/inverse "-., 0-9, A-Z
	if (token >= 0x8B && token <= 0xBF) {
		txt += '%';	// Inverse
	}
	// Use table
	txt += BASIC[token];
	// If not defined then use token in square brackets.
	if (!txt)
		txt = '[' + token + ']';
	return txt;
}
