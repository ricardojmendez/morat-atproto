const moratUrl = 'http://localhost:3000';

const POINTS_ON_LIKE = 25;

async function registerDID(did: string) {
	// console.log(`Registering DID ${did} ${encodeURIComponent(did)}`);
	const response = await fetch(`${moratUrl}/user/${encodeURIComponent(did)}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});

	// We will always try to create users, since Morat currently runs in-memory
	// and it may have been reset.
	if (response.status === 200) {
		const body = await response.json();
		// console.log(body);
		console.log(` . Created user ${did} epoch ${body.epochSignUp}`);
	}
}

async function giveLikePoints(likerDID: string, likedDID: string) {
	const assignResp = await fetch(
		`${moratUrl}/points/transfer/${encodeURIComponent(likerDID)}/${encodeURIComponent(likedDID)}/${POINTS_ON_LIKE}`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
		}
	);
	if (!assignResp.ok) {
		console.error(`Failed to assign points from ${likerDID} to ${likedDID}`);
		console.error(` . ${assignResp.status} ${assignResp.statusText}`);
	}
}

export async function trackLike(likerDID: string, likedDID: string) {
	await registerDID(likerDID);
	await registerDID(likedDID);
	await giveLikePoints(likerDID, likedDID);
}
