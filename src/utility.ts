

/**
 * A collection of useful functions.
 */
export class Utility {

	/**
	 * Returns a hex string from a number with leading zeroes.
	 * @param value The number to convert
	 * @param size The number of digits for the resulting string.
	 * @returns E.g. "AF" or "0BC8"
	 */
	public static getHexString(value: number|undefined, size: number): string {
		if(value != undefined) {
			var s = value.toString(16);
			const r = size - s.length;
			if(r < 0)
				return s.substr(-r);	// remove leading digits
			return "0".repeat(r) + s.toUpperCase();
		}
		// Undefined
		return "?".repeat(size);
	}


	/**
	 * Returns a binary string from a number with leading zeroes.
	 * @param value The number to convert
	 * @param size The number of digits for the resulting string.
	 */
	public static getBitsString(value: number, size: number) {
		var s = value.toString(2);
		return "0".repeat(size - s.length) + s;
	}


	/**
	 * Returns the ASCII character for a given value.
	 * @param value The value to convert
	 * @returns An ASCII character. Some special values for not printable characters.
	 */
	public static getASCIIChar(value: number): string {
		const res = (value == 0) ? '0\u0332' : ((value >= 32 && value < 127) ? String.fromCharCode(value) : '.');
		return res;
	}

	/**
	 * Same as getASCIIChar but returns &nbsp; instead of a space.
	 * @param value The value to convert
	 * @returns An ASCII/HTML character. Some special values for not printable characters.
	 */
	public static getHTMLChar(value: number): string {
		const res = (value == ' '.charCodeAt(0)) ? '&nbsp;' : Utility.getASCIIChar(value);
		return res;
	}



	/**
	 * Helper method to set a WORD from two successing indices in the
	 * given buffer. (Little endian)
	 * @param buffer The buffer to use.
	 * @param index The index into the buffer.
	 * @param value buffer[index] = value&0xFF; buffer[index+1] = value>>>8;
	 */
	public static setWord(buffer: Buffer, index: number, value: number) {
		buffer[index]=value&0xFF;
		buffer[index+1]=value>>>8;
	}


	/**
	 * Helper method to return a WORD from two successing indices in the
	 * given buffer. (Little endian)
	 * @param buffer The buffer to use.
	 * @param index The index into the buffer.
	 * @return buffer[index] + (buffer[index+1]<<8)
	 */
	public static getWord(buffer: Buffer, index: number): number {
		const value=buffer[index]+(buffer[index+1]<<8);
		return value;
	}


	/**
	 * Returns a string (0-terminated) from the buffer.
	 * @param data The buffer.
	 * @param startIndex String conversion starts here (and ends at the next found 0.
	 */
	public static getStringFromBuffer(data: Buffer, startIndex: number): string {
		// Get string
		let result='';
		const len=data.length;
		for (let i=startIndex; i<len; i++) {
			const char=data[i];
			if (char==0)
				break;
			result+=String.fromCharCode(char);
		}
		return result;
	}


	/**
	 * Creates a string from data bytes.
	 * @param data The data buffer.
	 * @param start The start index inside the buffer.
	 * @param count The max. number of data items to show.
	 */
	public static getStringFromData(data: Buffer, start=0, count=-1): string {
		if (count==-1)
			count=data.length;
		if (start+count>data.length)
			count=data.length-start;
		if (count<=0)
			return "---";

		let result="";
		let printCount=count;
		if (printCount>300)
			printCount=300;
		for (let i=0; i<printCount; i++)
		result+=data[i+start].toString()+" ";
		if (printCount!=count)
			result+="...";
		return result;
	}



	/**
	 * Own assert function that additionally does a log
	 * in case of a wrong assumption.
	 */
	public static assert(test: any, message?: string) {
		if (!test) {
			try {
				throw Error(message);
			}
			catch (err) {
				// Rethrow
				throw err;
			}
		}
	}

}

