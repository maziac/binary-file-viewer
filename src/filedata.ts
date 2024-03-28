import * as fs from 'fs';

/**
 * Used to read some data from the file in order to recognize the file type.
 * Is used by the user function registered with 'registerFileType'.
 * Reads data from the file only if the user really accesses it.
 * I.e. normally this function is not used at all.
 * But it can be useful if there are a lot of files with the same extension but
 * different in contents. E.g. stored protocol messages.
 */
export class FileData {

	// The file path
	protected path: string;

	// The file handle
	protected fd: number;

	// The file size in bytes.
	protected fileSize: number;


	/**
	 * Constructor.
	 * @param path The file path.
	 */
	constructor(path: string) {
		this.path = path;
	}


	/**
	 * Opens the file if not done yet.
	 */
	protected open() {
		if (this.fd == undefined) {
			// Open the file
			this.fd = fs.openSync(this.path, 'r');
		}
	}


	/**
	 * Returns the bytes from the file at the given offset.
	 * Use this inside 'registerFileType' to examine the file type.
	 * @param offset The file offset.
	 * @param length The number of bytes to return.
	 * @returns A number array with the values. The length of the array might
	 * be smaller than 'length' if the file size is smaller.
	 */
	public getBytesAt(offset: number, length = 1): number[] {
		this.open();
		this.getFileSize();
		if (offset + length > this.fileSize) {
			// Clip
			length = this.fileSize - offset;
			if (length < 0)
				length = 0;
		}
		const dataBuffer = Buffer.alloc(length);
		fs.readSync(this.fd, dataBuffer, 0, length, offset);
		return [...dataBuffer];
	}


	/**
	 * Close the file.
	 */
	public close() {
		if (this.fd != undefined) {
			// Close the file
			fs.closeSync(this.fd);
			this.fd = undefined as any;
		}
	}

	/**
	 * @returns Returns the file size in bytes.
	 */
	public getFileSize(): number {
		if (this.fileSize == undefined) {
			const stats = fs.statSync(this.path);
			this.fileSize = stats.size;
		}
		return this.fileSize;
	}
}
