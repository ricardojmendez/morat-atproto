import { getProfile } from './api';
import { Database } from 'bun:sqlite';

const db = new Database('handles.sqlite', { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.query(
	'create table if not exists handles \
            (did text not null, \
             handle text not null, \
             primary key (did));'
).run();

const addHandleQuery = db.query(
	'insert into handles (did, handle) values (?1, ?2);'
);
const getHandleQuery = db.query('select handle from handles where did = ?1;');

function insertHandle(did: string, handle: string) {
	try {
		// We might get two attempts at updating the handle, so disregard that error
		addHandleQuery.run(did, handle!);
	} catch (e) {
		console.error(`Error adding handle for ${did}`, e);
	}
}

type LikePair = {
	liker: string;
	liked: string;
};

const likePairs: LikePair[] = [];

const INITIAL_BACK_OFF_TIME = 5000;
const BACK_OFF_INCREASE = 2;

// Anything above 10 seems to get us rate-limited fairly quickly
const FETCH_BATCH_SIZE = 10;
const BATCH_FREQUENCY = 50;

let backoffDeadline = 0;
let isProcessing = false;
let lastBackOffPeriod = 0;

setInterval(processLikePairs, BATCH_FREQUENCY);

export async function processLikePairs() {
	if (isProcessing || Date.now() < backoffDeadline) {
		return;
	}
	isProcessing = true;

	let fetchCount = 0;
	let anyFailed = false;

	const processPair = async (pair: LikePair) => {
		const liker = await getHandle(pair.liker);
		const liked = await getHandle(pair.liked);

		if (!liker || !liked) {
			// We are likely getting rate-limited - backoff
			anyFailed = true;
		} else {
			fetchCount++;
			console.log(`💖: ${liker} -> ${liked}`);
		}
	};

	const pairsToProcess = likePairs.slice(0, FETCH_BATCH_SIZE);
	await Promise.all(pairsToProcess.map(processPair));

	// Yes, there are several reasons why this retrieval could fail, and we
	// should likely check the reason and return a different status, but this
	// will do for now.
	if (anyFailed) {
		if (lastBackOffPeriod === 0) {
			lastBackOffPeriod = INITIAL_BACK_OFF_TIME;
		} else {
			lastBackOffPeriod *= BACK_OFF_INCREASE;
		}
		backoffDeadline = Date.now() + lastBackOffPeriod;
		console.warn(
			`Failed to retrieve - likely rate limited, backing off for ${lastBackOffPeriod}ms`
		);
	} else {
		lastBackOffPeriod = 0;
	}

	if (fetchCount > 0) {
		// Yes, this is quick and dirty, and there is a change the elements above
		// will not fail sequentially and we'll remove some we haven't actually gotten
		// a handle for. This is a PoC.
		likePairs.splice(0, fetchCount);
	}
	isProcessing = false;
}

export function addLikePair(liker: string, liked: string) {
	likePairs.push({ liker, liked });
}

export async function getHandle(did: string): Promise<string | undefined> {
	let handle: string | undefined = undefined;

	const dbHandle = getHandleQuery.get(did);
	if (dbHandle) {
		// @ts-ignore
		handle = dbHandle.handle;
		// console.debug(`Got handle from cache for ${did}: ${handle}`);
	}
	if (!handle) {
		try {
			const data = await getProfile(did);
			handle = data.handle;
			insertHandle(did, handle!);
		} catch (e) {
			console.error(`Error getting handle for ${did}`, e);
		}
	}
	return handle;
}
