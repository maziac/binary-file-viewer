# Important

Project is not usable yet.
Under construction !


# Support

If you like the "Binary File Viewer" please consider supporting it.

<a href="https://github.com/sponsors/maziac" title="Github sponsor">
	<img src="assets/button_donate_sp.png" />
</a>
&nbsp;&nbsp;
<a href="https://www.paypal.com/donate/?hosted_button_id=K6NNLZCTN3UV4&locale.x=en_DE&Z3JncnB0=" title="PayPal">
	<img src="assets/button_donate_pp.png" />
</a>


# Binary File Viewer

...



## Installation

Install through Visual Studio Code Marketplace.
The extension is called "Binary File Viewer".


# Usage

Just click on a file with the *.* extension.
The file is opened and shown in the text editor area.

![](assets/icon.png)


Alternatively you can open a binary file via "Open With...":

![](assets/icon.png)

When hovering over a value or register name you will get additional info like the offset or the value in decimal:

![](assets/icon.png)


# TODO


- Functions:
	- Read until certain byte value
	- Read string (until 0)
	- Functions for customizing
		- colors
		- indentation
	- Reading bits
	- createMemDump: mit ASCII chars Ausgabe

- How to customize the file extensions? I.e. that the binary-file-viewer reacts only on certain (customized) file extensions.

- file in completion etc überprüfen, ob path passt.
- Besser: nicht nur file extensions sondern glob pattern und auch Teil-dekodierung des Headers zulassen um richtigen Parser zu finden.


- number-plotter: Vielleicht auch zoom/pan implementieren.