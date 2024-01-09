import { sendRequest } from '../utils/utils.js';

const requestInit = {
	method: 'GET',
	headers: {
		'Content-Type': 'application/json',
	},
};

const baseUrl = 'https://d16m5wbro86fg2.cloudfront.net';

type UserSummary = {
	id: string;
	username: string;
	location: string;
	brickCount: number;
};

type UserSummaries = {
	Users: UserSummary[];
};

export type Variant = {
	color: string;
	count: number;
};

export type UserCollectionItem = {
	pieceId: string;
	variants: Variant[];
};

export type UserData = UserSummary & {
	collection: UserCollectionItem[];
};

export async function getUsers() {
	const url = new URL(`/api/users`, baseUrl);
	const response = await sendRequest(url, requestInit);

	return (await response.json()) as UserSummaries;
}

export async function getUserSummary(userName: string) {
	const url = new URL(`/api/user/by-username/${userName}`, baseUrl);
	const response = await sendRequest(url, requestInit);

	return (await response.json()) as UserSummary;
}

export async function getUserData(id: string) {
	const url = new URL(`/api/user/by-id/${id}`, baseUrl);
	const response = await sendRequest(url, requestInit);

	return (await response.json()) as UserData;
}

export async function getUsersData() {
	const users = await getUsers();

	return Promise.all(
		users.Users.map(async (user) => {
			return getUserData(user.id);
		})
	);
}
