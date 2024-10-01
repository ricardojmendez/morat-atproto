import { getProfile } from './api';

const handleMap: Map<string, string> = new Map();

export async function getHandle(did: string): Promise<string | undefined> {
	let handle: string | undefined = undefined;
	if (handleMap.has(did)) {
		handle = handleMap.get(did);
		console.debug(`CACHE HIT: ${did} -> ${handle}`);
	} else {
		try {
			const data = await getProfile(did);
			handle = data.handle;
			handleMap.set(did, handle!);
		} catch (e) {
			console.error(`Error getting handle for ${did}`, e);
		}
	}
	return handle;
}
