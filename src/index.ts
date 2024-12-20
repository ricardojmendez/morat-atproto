import { Jetstream } from '@skyware/jetstream';

import { queueLikePairForQuery, getHandle } from './cache';
import { trackLike } from './morat';

// A couple of known DIDs:
// pfrazee.com -> did:plc:ragtjsm2j2vknwkz3zp4oxrd
// ricardo.bsky.social -> did:plc:cf6futaebyc2k4wgzsr4v42k

console.log(`Handle: ${await getHandle('did:plc:ragtjsm2j2vknwkz3zp4oxrd')}`);
console.log(`Handle: ${await getHandle('did:plc:cf6futaebyc2k4wgzsr4v42k')}`);

const MAX_DATA_PAUSE = 5000;
let lastDataInput = Date.now();

// const jetstream = new Jetstream({ endpoint: "ws://localhost:6008/subscribe" });
const jetstream = new Jetstream({
	// wantedCollections: ["app.bsky.feed.post", "app.bsky.feed.like"],
	wantedCollections: ['app.bsky.feed.like'],
});

jetstream.onCreate('app.bsky.feed.like', (event) => {
	lastDataInput = Date.now();
	const likedRepo = event.commit.record.subject.uri.split('/')[2];
	queueLikePairForQuery(event.did, likedRepo);
	trackLike(event.did, likedRepo);
});

const connect = () => {
	jetstream.start();
	// Workaround for bun issues
	jetstream.ws!.binaryType = 'arraybuffer';
	console.log('🦋 Jetstream is running');
};

setInterval(() => {
	if (Date.now() - lastDataInput > MAX_DATA_PAUSE) {
		console.error('🚨 No data input for a while, restarting Jetstream');
		jetstream.close();
		connect();
	}
}, MAX_DATA_PAUSE);

connect();
