import { logger } from '../utils/logger.js';
import type { SetDetail } from '../integration/set.js';
import type { UserData, UserCollectionItem, Variant } from '../integration/user.js';

export async function setsWhichUserCanBuildAlone(username: string, usersData: UserData[], setsData: SetDetail[]) {
	const userCollection = usersData.find((user) => user.username === username);
	if (userCollection === undefined) {
		throw new Error(`Collection for ${username} not found.`);
	}

	const userCollectionMap = convertCollectionToMap(userCollection.collection);

	return setsWhichCanBeBuiltWithCollection(userCollectionMap, setsData);
}

async function setsWhichCanBeBuiltWithCollection(userCollection: Map<string, Variant[]>, setsData: SetDetail[]) {
	const userCanBuildSetResults = [];

	for (const set of setsData) {
		userCanBuildSetResults.push(userCanBuildSet(userCollection, set));
	}

	const setsWhichUserCanBuild = await Promise.all(userCanBuildSetResults);

	return setsWhichUserCanBuild.filter((element) => element.userCanBuildSet).map((element) => element.setName);
}

export async function collaboratorsWithWhomSetCanBeBuilt(
	username: string,
	setName: string,
	usersData: UserData[],
	setsData: SetDetail[]
) {
	const userCollection = usersData.find((user) => user.username === username);

	if (userCollection === undefined) {
		throw new Error(`Collection for ${username} not found.`);
	}

	const userCollectionMap = convertCollectionToMap(userCollection.collection);
	const collaboratorsData = usersData.filter((user) => user.username !== username);
	return getCollaboratorsForCollectionAndSet(setName, userCollectionMap, collaboratorsData, setsData);
}

async function getCollaboratorsForCollectionAndSet(
	setName: string,
	userCollectionMap: Map<string, Variant[]>,
	collaboratorsData: UserData[],
	setsData: SetDetail[]
) {
	const userCanBuildSetResults = [] as Array<
		Promise<{
			setName: string;
			userCanBuildSet: boolean;
			collaborator: string | undefined;
		}>
	>;

	for (const collaboratorData of collaboratorsData) {
		const combinedCollections = combineCollections(userCollectionMap, collaboratorData.collection);

		userCanBuildSetResults.push(
			userCanBuildSet(
				combinedCollections,
				setsData.find((set) => set.name === setName)!,
				collaboratorData.username
			)
		);
	}

	const collaboratorsWithWhomSetCanBeBuilt = await Promise.all(userCanBuildSetResults);

	return collaboratorsWithWhomSetCanBeBuilt
		.filter((element) => element.userCanBuildSet)
		.map((element) => element.collaborator);
}

async function userCanBuildSet(userCollection: Map<string, Variant[]>, set: SetDetail, collaborator?: string) {
	let userCanBuildSet = true;

	for (const piece of set.pieces) {
		try {
			let userHasPiece = false;
			const userPieceVariants = userCollection.get(piece.part.designID);

			if (!userPieceVariants) {
				break;
			}

			logger.debug(
				`Searching for piece: ${piece.part.designID}, colour: ${piece.part.material}, quantity: ${piece.quantity}...`
			);

			// Check if user has piece in the correct colour and quantity.
			for (const variant of userPieceVariants) {
				logger.debug(`Comparing user piece with colour: ${variant.color}, quantity: ${variant.count}...`);

				if (Number(variant.color) === piece.part.material && variant.count >= piece.quantity) {
					userHasPiece = true;
					logger.debug(
						`Piece found in user set piece: ${piece.part.designID}, colour: ${variant.color}, quantity: ${variant.count}.`
					);
					break;
				}
			}

			if (!userHasPiece) {
				logger.debug(
					`User doesn't have piece ${piece.part.designID} in colour: ${piece.part.material} quantity:
					${piece.quantity} for set ${set.name}, exiting comparison...`
				);
				userCanBuildSet = false;
			}
		} catch (error) {
			logger.debug('Error determining if user has all set pieces:', error);
			break;
		}

		if (!userCanBuildSet) {
			break;
		}
	}

	if (userCanBuildSet) {
		if (collaborator) {
			logger.info(`User can build set ${set.name} with ${collaborator}. ✅🧱`);
		} else {
			logger.info(`User can build set ${set.name}. ✅🧱`);
		}

		return { setName: set.name, userCanBuildSet: true, collaborator };
	}

	if (collaborator) {
		logger.info(`User can't build set ${set.name} with ${collaborator}. ❌🧱`);
	} else {
		logger.info(`User can't build set ${set.name}. ❌🧱`);
	}

	return { setName: set.name, userCanBuildSet: false, collaborator };
}

function combineCollections(collection: Map<string, Variant[]>, otherCollection: UserCollectionItem[]) {
	const combinedCollections = new Map(collection);

	for (const otherCollectionItem of otherCollection) {
		if (combinedCollections.has(otherCollectionItem.pieceId)) {
			const collectionVariants = combinedCollections.get(otherCollectionItem.pieceId)!;

			for (const variant of otherCollectionItem.variants) {
				const index = collectionVariants.findIndex((element) => element.color === variant.color);
				if (index !== -1) {
					collectionVariants[index].count += variant.count;
				}
			}
		} else {
			combinedCollections.set(otherCollectionItem.pieceId, otherCollectionItem.variants);
		}
	}

	return combinedCollections;
}

function convertCollectionToMap(collection: UserCollectionItem[]) {
	return new Map(collection.map((item) => [item.pieceId, item.variants]));
}
