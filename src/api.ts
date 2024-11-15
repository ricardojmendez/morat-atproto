import dotenv from 'dotenv';
import { XRPC, CredentialManager } from '@atcute/client';

dotenv.config();

const identifier = process.env.IDENTIFIER;
const password = process.env.PASSWORD;

const manager = new CredentialManager({ service: 'https://bsky.social' });
const rpc = new XRPC({ handler: manager });

if (identifier && password) {
	await manager.login({
		identifier,
		password,
	});
}

export const isLoggedIn = manager.session;

if (!manager.session) {
	console.error(
		`There was an error logging in as ${process.env.IDENTIFIER}.\nHave you set the IDENTIFIER and PASSWORD environment variables?`
	);
}

/**
 * Returns a profile from a did
 * @param actor DID
 * @returns Profile object
 */
export async function getProfile(actor: string) {
	const { data } = await rpc.get('app.bsky.actor.getProfile', {
		params: {
			actor,
		},
	});
	return data;
}

/**
 * Resolves which DID is associated with a handle using the API
 * @param handle Public handle
 * @returns Corresponding DID for the handle
 */
export async function resolveHandle(handle: string) {
	const { data } = await rpc.get('com.atproto.identity.resolveHandle', {
		params: {
			handle,
		},
	});
	return data;
}
