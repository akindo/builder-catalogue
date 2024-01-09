import { main } from './main.js';
import { getErrorMessage } from './utils/error-handling.js';

console.time('executionTime');

try {
	await main();
} catch (error) {
	throw new Error('Error starting main(): ' + getErrorMessage(error));
}

console.timeEnd('executionTime');
