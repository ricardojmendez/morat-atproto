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

// const handleMap: Map<string, string> = new Map();

function addHandle(did: string, handle: string) {
	try {
		// We might get two attempts at updating the handle, so disregard that error
		addHandleQuery.run(did, handle!);
	} catch (e) {
		console.error(`Error adding handle for ${did}`, e);
	}
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
			addHandle(did, handle!);
		} catch (e) {
			console.error(`Error getting handle for ${did}`, e);
		}
	}
	return handle;
}
