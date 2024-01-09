import { logger } from './logger.js';

export async function sendRequest(url: URL, requestInit: RequestInit) {
	logRequest(url, structuredClone(requestInit));
	const response = await fetch(url, requestInit);
	await logResponse(response.clone());

	return response;
}

function logRequest(url: URL, requestInit: RequestInit) {
	logger.trace(`Sending request to ${url.toString()}`, requestInit);
}

async function logResponse(response: Response) {
	const responseJson: unknown = await response
		.json()
		.then((json: unknown) => json)
		.catch(() => ({}));
	logger.trace(`Response:`, response.status, response.statusText, responseJson);
}
