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

![](assets/usage.gif)

Alternatively you can open a binary file via "Open With...":

![](assets/usage-open-with.gif)

When hovering over a value or register name you will get additional info like the offset or the value in decimal:

![](assets/hovering.gif)


# TODO

- How to customize the file extensions? I.e. that the binary-file-viewer reacts only on certain (customized) file extensions.
- Ich sollte dabei bleiben, das erst lazy auf webview Seite zu dekodieren.
Da, wenn ich mal den chart view einbaue, dass coh eine nicht unerhebliche Zeit dauern könnte bis der alles fertig gerendert hätte.
Ausserdem könnte ich dann chart.js vielleicht nicht so einfach dazu binden.

- Den folder 'parsers' überwachen. Ein neues html file erzeugen bei Veränderung.
Für den angegebenen Typ.
Z.B,
- parsers
	- obj
		- objparse.js
	- bin
		- binparse.js
	- ..js
- In den Preferences kann man dann file extensions damit verbinden. Oder besser über den filenamen (Convention). Oder noch besser im File selbst.
In 'resolveCustomEditor' wird dann geprüft, ob es eine config für das file gibt.
- Ich müsste parallel die files auch im extension code laden, um syntax Fehler zu finden.