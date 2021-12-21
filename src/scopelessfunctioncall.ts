import * as vm from 'vm';


/**
 * Runs a function given as string (the body only) in a safe environment.
 * I.e. the function is not able to access any global scope or block scope.
 * Any value has to be passed through the parameters.
 *
 * Example 1:
 * scopeLessFunction({a: 1, b: 2}, 'return a+b;');
 * Returns 3.
 *
 * If you want to pass a global value use e.g.:
 * scopeLessFunction('console.log("a+b=", a+b);', {a: 1, b: 2, console});
 * This prints: "a+b= 3"
 *
 * @param funcBodyString The string with the function body.
 * @param parameters The parameters to pass to the function. Direct access is only
 * possible to these parameters. E.g. {a: 1, b: 2} to pass 'a' and 'b' with the given values.
 * @returns The value the given function would return.
 * @throws An exception if the code cannot be compiled.
 */
export function scopeLessFunctionCall(funcBodyString: string, parameters = {}): any {
//	console.time('scopeLessFunctionCall');
	const sandboxedFuncStr = 'with (sandbox) {\n' + funcBodyString + '\n}';
	const code = new Function('sandbox', sandboxedFuncStr);
	const sandboxProxy = new Proxy(parameters, {has, get});
	const result = code(sandboxProxy);
//	console.timeEnd('scopeLessFunctionCall');
	return result;
}


// These traps intercepts 'in' operations on sandboxProxy.
// This is to prohibit access to the global object.
function has(target: any, key: any) {
	return true;
}
function get(target: any, key: any) {
	if (key === Symbol.unscopables)
		return undefined;
	return target[key]
}


/**
 * Similar to scopeLessFunctionCall this runs a function in a safe environment.
 * In contrast it uses the vm for execution.
 * The advantage is that in case of errors the line numbers are returned.
 * Drawback is that it is slower than scopeLessFunctionCall. But that is neglectable.
 * From my measurements scopeLessFunctionCall takes 1.5ms and vmRunInNewContext varies a bit around 2ms.
 *
 * Example 1:
 * vmRunInNewContext({a: 1, b: 2}, 'return a+b;');
 * Returns 3.
 *
 * If you want to pass a global value use e.g.:
 * vmRunInNewContext('console.log("a+b=", a+b);', {a: 1, b: 2, console});
 * This prints: "a+b= 3"
 *
 * @param funcBodyString The string with the function body.
 * @param parameters The parameters to pass to the function. Direct access is only
 * possible to these parameters. E.g. {a: 1, b: 2} to pass 'a' and 'b' with the given values.
 * @param filePath Optional. Used as path for shown in case of errors.
 * @returns The value the given function would return.
 * @throws An exception if the code cannot be compiled. The Error contains line and column number in
 * textual format.
 * It will give an exception for obvious errors but not for e.g. non-existing functions or variables.
 * This would require a runtime check (on all branches).
 */
export function vmRunInNewContext(funcBodyString: string, parameters = {}, filePath?: string): any {
	//	console.time('vmRunInNewContext');
	const result = vm.runInNewContext(funcBodyString, parameters, filePath);
	//	console.timeEnd('vmRunInNewContext');
	return result;
}

// TODO: Remove
export function vmCreateScript(funcBodyString: string, filePath?: string): vm.Script {
	//	console.time('vmRunInNewContext');
	const result = new vm.Script(funcBodyString, {filename: filePath, columnOffset: 1});
	//	console.timeEnd('vmRunInNewContext');
	return result;
}

