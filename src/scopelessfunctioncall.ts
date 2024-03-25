import * as vm from 'vm';


/**
 * Similar to scopeLessFunctionCall this runs a function in a safe environment.
 * In contrast it uses the vm for execution.
 * This is done because 'new Function()' in the Node.js environment does not
 * return line numbers in the error stack.
 * Drawback is that it is a little slower than scopeLessFunctionCall. But that is neglectable.
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
 * @param filePath Optional. Used as path shown in case of errors. Not used.
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
