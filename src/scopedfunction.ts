

/*
class CF {
	public customFunction() {
		// Customer Code
		console.log("BMAMLMBAMB");
	}
}
const cf = new CF();
cf.customFunction();
*/


function customFunction(txt: string) {
	// Customer Code
	console.log("BMAMLMBAMB: " + txt);
}
customFunction('global');

/*
let abcd = 5;

function evalCustomFunc() {
	//eval('customFunction();');
	const c = new Function('console.log("abcd=", abcd);');
	c();
}
evalCustomFunc();
*/

function codeFunc(sandbox: any) {
	const code = new Function('sandbox', 'with (sandbox) { cf("sandb "); }');
	//const code = new Function('sandbox', '{ console.log("---dddd"); customFunction(); console.log("---eeeee"); }');
	const sandboxProxy = new Proxy(sandbox, {has, get});
	//const sandboxProxy = new Proxy(sandbox, {});
	return code(sandboxProxy);
	//	code('afafag');
}

codeFunc({cf: customFunction});

console.log('-end');

// this trap intercepts 'in' operations on sandboxProxy
// Never access global object.
function has(target: any, key: any) {
	return true;
}

function get(target: any, key: any) {
	if (key === Symbol.unscopables)
		return undefined;
	return target[key]
}
