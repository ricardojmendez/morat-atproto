# Morat - ATProto experiment

## Concept

The plan is to test Morat's reference implementation with real-world behavior, and the ATProto event stream is a good high-volume source of user actions.

This application will feed from those events and generate equivalent actions on Morat, to see how the point assignment acts and what the data load is like.

General idea:

- Every user gets 100k points per epoch;
- Epochs last a day (during tests, likely bumping this to a week later);
- A like is 100 points, a re-skeet is 400 points;
- Do not consider quote-skeets, given I can't evaluate if it's being quoted in a positive context or to dunk on it.

Everything in Morat remains the same other than the epoch length change and total points, so like in Morat, there are no backsies even if you unlike or unboost a post.

See *Point Amounts and distribution* below.

## TODO

- [x]  Subscribe to ATProto Like feed
- [ ] Subscribe to ATProto Post feed
- [x] Get the associated label for a user DID
	- [x] Cache label locally
	- [x] If either sender or recipient do not exist, create them based on the DID
- [ ] Get a creator for an associated post DID
	- [x] Potentially cache the associated creator for a DID
- [x] Integrate Like events with Morat
- [ ] Integrate Post events with Morat


### Handle caching

While I am successfully querying for the user handles, I get rate-limited if I attempt to get them at the speed that they are actually coming in. This means there will be some events for which we are likely to not have a human-readable handle. It's best to track things based on the DID, and then add a display label for those for which we do know the handle.

### Point amounts and distribution

Reasoning about the points a bit, given that:

1. a primary goal is to have relationships spread to the network; 
2. points decay by 10% every epoch;
3. Morat will not transfer less than 1 point;
4. Morat does not use point fractions, but instead uses only integers;

Then it seems like a sensible approach would be to:

1. Have an action assign a minimum of 100 points;
2. Treat that as a fixed-point number with two decimals;
3. Consider if there's a number of actions per user where we'd like to cap the impact per epoch (eg. 1000 likes, 250 re-skeets, or any combination thereof);
4. Calculate the total number of points per epoch based on that.

I'm currently going to run with those numbers as a draft. Even if epochs last a week, 1000 likes would allow for 142 likes a day (TODO: evaluate how terminally online the average user is).

That means 7-day epochs and 100k as the basic number of points.


## Development

To start the development server run:

```bash
bun run dev --watch
```

### Environment configuration

If you want to retrieve the handle attached to a DID, you will need a BlueSky identifier and password.  Set these up under `IDENTIFIER` and `PASSWORD` on the environment variables.

```
IDENTIFIER="your-app-username.bsky.social"
PASSWORD="the-app-password"
```

This doesn't need to be you main user account - you can create an independent account for your test application.