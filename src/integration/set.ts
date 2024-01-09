import { sendRequest } from '../utils/utils.js';

const requestInit = {
	method: 'GET',
	headers: {
		'Content-Type': 'application/json',
	},
};

const baseUrl = 'https://d16m5wbro86fg2.cloudfront.net';

type Set = {
	id: string;
	name: string;
	setNumber: string;
	totalPieces: number;
};

type Sets = {
	Sets: Set[];
};

type Piece = {
	part: {
		designID: string; // Aka. pieceId
		material: number; // Aka. color
		partType: string;
	};
	quantity: number; // Aka. count
};

export type SetDetail = {
	id: string;
	name: string;
	setNumber: string;
	pieces: Piece[];
};

export async function getSets() {
	const url = new URL(`/api/sets`, baseUrl);
	const response = await sendRequest(url, requestInit);

	return (await response.json()) as Sets;
}

export async function getSetData(id: string) {
	const url = new URL(`/api/set/by-id/${id}`, baseUrl);
	const response = await sendRequest(url, requestInit);

	return (await response.json()) as SetDetail;
}

export async function getSetsData() {
	const sets = await getSets();

	return Promise.all(
		sets.Sets.map(async (set) => {
			return getSetData(set.id);
		})
	);
}
