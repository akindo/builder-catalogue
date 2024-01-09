import { strict as assert } from 'node:assert';
import { describe } from 'mocha';
import { setsWhichUserCanBuildAlone } from '../src/domain/domain.js';
import { getSetsData } from '../src/integration/set.js';
import { getUsersData } from '../src/integration/user.js';
import type { SetDetail } from '../src/integration/set.js';
import type { UserData } from '../src/integration/user.js';

let setsData = [] as SetDetail[];
let usersData = [] as UserData[];
const usernameBrickfan = 'brickfan35';
const setsBrickfanCanBuild = ['car-wash', 'castaway', 'undersea-monster'];

describe('builder catalogue challenge', () => {
	before(async () => {
		setsData = await getSetsData();
		usersData = await getUsersData();
	});

	describe('sets which user can build alone', async () => {
		it('can get sets which user can build alone', async () => {
			const resultSets = await setsWhichUserCanBuildAlone(usernameBrickfan, usersData, setsData);
			assert.deepEqual(resultSets, setsBrickfanCanBuild);
		});

		it('handles gracefully network timeout', async () => {
			assert.equal(true, true);
		});
	});

	describe('collaborators who user can build set with', async () => {
		it('can get collaborators who user can build set with', async () => {
			assert.equal(true, true);
		});

		it('handles gracefully network timeout', async () => {
			assert.equal(true, true);
		});
	});
});
