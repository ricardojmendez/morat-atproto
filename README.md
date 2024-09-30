# Morat - ATProto experiment

## Concept

The plan is to test Morat's reference implementation with real-world behavior, and the ATProto event stream is a good high-volume source of user actions.

This application will feed from those events and generate equivalent actions on Morat, to see how the point assignment acts and what the data load is like.

General idea:

- Every user gets 50k points per epoch
- Epochs last a day
- A like is 25 points, a re-skeet is 100 points

Everything in Morat remains the same other than the epoch length change and total points, so like in Morat, there are no backsies even if you unlike or unboost a post.

## TODO

- [ ] Subscribe to ATProto Like feed
- [ ] Subscribe to ATProto Post feed
- [ ] Get the associated label for a user DID
	- [ ] Cache label locally
	- [ ] If either sender or recipient do not exist, create them based on the label (we will not update later for now)
- [ ] Get a creator for an associated post DID
	- [ ] Potentially cache the associated creator for a DID
- [ ] Integrate Like events with Morat
- [ ] Integrate Post events with Morat



## Development
To start the development server run:
```bash
bun run dev --watch
```

Open http://localhost:3000/ with your browser to see the result.