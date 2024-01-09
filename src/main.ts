import { logger } from './utils/logger.js';
import { getSetsData } from './integration/set.js';
import { getUsersData } from './integration/user.js';
import { collaboratorsWithWhomSetCanBeBuilt, setsWhichUserCanBuildAlone } from './domain/domain.js';

const usernameBrickfan = 'brickfan35';
const usernameLandscapeArtist = 'landscape-artist';
const setName = 'tropical-island';

export async function main() {
	logger.info(`======= \u001B[92mBuilder Catalogue Challenge\u001B[0m =======`);

	const setsData = await getSetsData();
	const usersData = await getUsersData();

	logger.info(`Processing for user \u001B[92m${usernameBrickfan}\u001B[0m...`);
	const setsWhichUserCanBuild = await setsWhichUserCanBuildAlone(usernameBrickfan, usersData, setsData);
	logger.info(`User can build sets \u001B[92m${setsWhichUserCanBuild.join(', ')}\u001B[0m.\n`);

	// Stretch goal 1.
	logger.info(`Processing for user \u001B[92m${usernameLandscapeArtist}\u001B[0m...`);
	const setsWhichUserCanCollaborate = await collaboratorsWithWhomSetCanBeBuilt(
		usernameLandscapeArtist,
		setName,
		usersData,
		setsData
	);
	logger.info(`User can build set ${setName} with \u001B[92m${setsWhichUserCanCollaborate.join(', ')}\u001B[0m.\n`);
}
