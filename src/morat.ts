const moratUrl = 'http://localhost:3000';

const POINTS_ON_LIKE = 25;

const seenDIDs = new Set<string>();

async function registerDID(did: string) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 2000);

	try {
		const response = await fetch(
			`${moratUrl}/user/${encodeURIComponent(did)}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
				signal: controller.signal,
			}
		);

		if (response.status === 200) {
			const body = await response.json();
			console.log(` . Created user ${did} epoch ${body.epochSignUp}`);
		}
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.error(`Request to register DID ${did} timed out`);
		} else {
			console.error(`Failed to register DID ${did}:`, error);
		}
	} finally {
		clearTimeout(timeoutId);
	}
}

async function giveLikePoints(likerDID: string, likedDID: string) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 5000);

	try {
		const assignResp = await fetch(
			`${moratUrl}/points/transfer/${encodeURIComponent(likerDID)}/${encodeURIComponent(likedDID)}/${POINTS_ON_LIKE}`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal,
			}
		);

		if (!assignResp.ok) {
			console.error(`Failed to assign points from ${likerDID} to ${likedDID}`);
			console.error(` . ${assignResp.status} ${assignResp.statusText}`);
		} else {
			console.log(`💖: ${likerDID} -> ${likedDID}`);
		}
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.error(
				`Request to assign points from ${likerDID} to ${likedDID} timed out`
			);
		} else {
			console.error(
				`Failed to assign points from ${likerDID} to ${likedDID}:`,
				error
			);
		}
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function trackLike(likerDID: string, likedDID: string) {
	const promises = [];
	for (const did of [likerDID, likedDID]) {
		if (!seenDIDs.has(did)) {
			promises.push(registerDID(did));
			seenDIDs.add(did);
		}
	}

	await Promise.all(promises);
	await giveLikePoints(likerDID, likedDID);
}
