# The Binary File Viewer
## Concept

The 'Binary File Viewer' is a framework that allows you to build your own custom viewers for binary files.
These files can be either existing file formats for which no vscode extension exists or also proprietary file formats.
I.e. file formats that you build on your own and for which you would like to have a convenient way to look inside.

To tell the 'Binary File Viewer' what files to decode and how, you have to provide a javascript file.
This *.js file consist of 2 stages. I.e. you basically register 2 functions:
- with 'registerFileType' you register the function which checks for the right file type. Normally you just check the file extension here.
- with 'registerParser' you register the function which actually decodes the binary file.


## registerFileType

The 'Binary File Viewer' itself registers inside vscode for every file type (*.*).
I.e. whenever you select a file to be viewed the 'Binary File Viewer' will iterate through all of your js files until it finds one that returns true to idicate that it can decode the file.

Here is an example that registers for 'wav' files by checking the file extension:
~~~js
registerFileType((fileExt, filePath, fileData) => {
	// Check for wav extension
	if (fileExt == 'wav') {
		return true;
	}
	return false;
});
~~~

For more complicated checks other arguments are passed:
- fileExt: The file extension without the '.', e.g. 'wav'.
- filePath: The absolute file path to the binary file.
- fileData: You can access the file data through this object.

Although normally not required, ```fileData``` can be quite handy in some situations.
With ```fileData```you can access the file contents and check e.g. the header of a file for certain data. E.g. some files carry an ID at the start of the file to identify the file type.
E.g. a more enhanced version of the file type check for wav files could look like this:
~~~js
registerFileType((fileExt, filePath, fileData) => {
	// Check for wav extension
	if (fileExt == 'wav') {
		const headerArray = fileData.getBytesAt(0, 4);
		const header = String.fromCharCode(...headerArray)
		if (header == 'RIFF')
			return true;
	}
	return false;
});
~~~
This example checks for the string 'RIFF' at the beginning of the wav file. If not found it is not recognized as wav file.

Note: at this stage the file data is only read if you make use of ```fileData```. Otherwise, for performance reasons, the file data is not read.

On ```fileData``` two methods can be called:
- ```getBytesAt(offset: number, length = 1): number[]```
Returns the bytes from the file at the given offset.
	- ```offset```: The file offset.
	- ```length```: The number of bytes to return. Defaults to 1.
	- returns: A number array with the values. The length of the array might be smaller than 'length' if the file size is smaller.
- ```getFileSize(): number```
Returns the file size in bytes.


## registerParser

This is the main function you need to install.
Here you read in the data from the file and you create the output for the viewer's window.
Basically you add a row for each decoded value in a table.

![](help1.jpg)

The above output is achieved with the following 4 lines of code:
~~~

registerParser(() => {
	read(4);
	addRow('RIFF id', getStringValue(), 'RIFF file description header');

	read(4);
	addRow('File size', getNumberValue(), 'The file size LESS the size of the "RIFF" description (4 bytes) and the size of file description (4 bytes).');
}
~~~

The addRow parameters correspond exactly with the columns in the shown row.

```addRow(name: string, value?: string|number, shortDescription?: string)```
- ```name```: The name of the value.
- ```value```: (Optional) The value to display.
- ```shortDescription```: (Optional) A short description of the entry.

The first 2 columns are automatically filled by the 'Binary File viewer':
- Offset: Is the offset from the start of the file.
- Size: Is the size of the data object represented by the row.

An important aspect of the size is that it is no parameter to the ```addRow```.
In fact it is directly used from the previous ```read```.


## read

As you have seen before: with ```read``` you will read in data from the file.
The reading starts at the last position. I.e. for the first ```read```at offset 0 or for the following ```read``` after the previous ```read```.

All of the ```get...``` functions work on the data of the previous ```read```.

This example reads in a single byte:
~~~
read(1);
const val = getNumberValue();
~~~

Because the size was 1, ```getNumberValue```will return only 1 byte.

In the next example a word, i.e. a 2 byte number, is read:

~~~
read(2);
const val = getNumberValue();
~~~

The ```get...``` functions do not change the file offset in any way.
I.e. in the following example:
~~~
read(2);
const val1 = getNumberValue();
const val2 = getNumberValue();
~~~

```val1``` and ```val2``` are the same values. They are read from the same file data offsets.


## addDetails

```addDetails```is used to make rows expandable.
I.e. when using ```addDetails``` the previous row gets a '+' sign:
![](help2a.jpg)

If you click it with the mouse the row expands:
![](help2b.jpg)

Here is the code for the above:
~~~js
	read(4);
	addRow('RIFF id', getStringValue(), 'RIFF file description header');

	addDetails(() => {
		read(1);
		addRow('1rst char', getNumberValue());
		read(1);
		addRow('2nd char', getNumberValue());
		read(1);
		addRow('3rd char', getNumberValue());
		read(1);
		addRow('4th char', getNumberValue());
	});
~~~

When you use ```addDetails``` the current file offset position and the read size is pushed on an internal stack and popped when the ```addDetails``` function finishes.

I.e. the next row can be decoded just like before with:
~~~js
	read(4);
	addRow('RIFF id', getStringValue(), 'RIFF file description header');

	addDetails(() => {
		read(1);
		addRow('1rst char', getNumberValue());
		read(1);
		addRow('2nd char', getNumberValue());
		read(1);
		addRow('3rd char', getNumberValue());
		read(1);
		addRow('4th char', getNumberValue());
	});

	read(4);
	addRow('File size', getNumberValue(), 'The file size LESS the size of the "RIFF" description (4 bytes) and the size of file description (4 bytes).');
~~~

![](help2c.jpg)


## addMemDump

If you just want to output a memory dump of a region you can use ```addMemDump```.
If you additionally put it into ```addDetails```you can make it expandable.

E.g.:
~~~
	read(1000);
	addRow('Mem Dump');
	addDetails(() => {
		read(1000);
		addMemDump();
	});
~~~

results in:
![](help3.jpg)

Note: Hovering above the values will give additional information about the relative and absolute offset.


## addChart

To visualize data series you can use the ```addChart``` command.

![](help4.jpg)

In the basic form you just need to collect data in a number array that you can then use for display in a chart.

~~~js
	const samples = getData(2);
	addChart({
		series: [samples]
	}, 'Samples');
~~~
