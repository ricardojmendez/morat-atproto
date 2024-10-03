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

const toRetrieve = new Set<string>();

const INITIAL_BACK_OFF_TIME = 5000;
const MAX_BACK_OFF_TIME = 15 * 60 * 1000;
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

	let anyFailed = false;

	const retrieved = new Set<string>();
	const processDID = async (did: string) => {
		const handle = await getOrCreateHandle(did);

		if (!handle) {
			// We are likely getting rate-limited - backoff
			anyFailed = true;
		} else {
			console.debug(` . 🗂️ handle ${did} -> ${handle}`);
			retrieved.add(did);
		}
	};

	const didsToProcess = Array.from(toRetrieve).slice(0, FETCH_BATCH_SIZE);
	await Promise.all(didsToProcess.map(processDID));

	// Yes, there are several reasons why this retrieval could fail, and we
	// should likely check the reason and return a different status, but this
	// will do for now.
	if (anyFailed) {
		if (lastBackOffPeriod === 0) {
			lastBackOffPeriod = INITIAL_BACK_OFF_TIME;
		} else {
			lastBackOffPeriod = Math.min(
				MAX_BACK_OFF_TIME,
				lastBackOffPeriod * BACK_OFF_INCREASE
			);
		}
		backoffDeadline = Date.now() + lastBackOffPeriod;
		console.warn(
			`Failed to retrieve - likely rate limited, backing off for ${lastBackOffPeriod}ms`
		);
	} else {
		lastBackOffPeriod = 0;
	}

	for (const did of retrieved) {
		toRetrieve.delete(did);
	}
	isProcessing = false;
}

export function queueLikePairForQuery(liker: string, liked: string) {
	if (!getHandle(liker)) {
		toRetrieve.add(liker);
	}
	if (!getHandle(liked)) {
		toRetrieve.add(liked);
	}
}

export function getHandle(did: string): string | undefined {
	let handle: string | undefined = undefined;

	const dbHandle = getHandleQuery.get(did);
	if (dbHandle) {
		// @ts-ignore
		handle = dbHandle.handle;
		// console.debug(`Got handle from cache for ${did}: ${handle}`);
	}
	return handle;
}

export async function getOrCreateHandle(
	did: string
): Promise<string | undefined> {
	let handle = getHandle(did);

	if (handle) {
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
