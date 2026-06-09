# World Cup data

Where the seed data comes from, what it covers, and what it does not.

The source is the [football-data.org](https://www.football-data.org/) v4 API.
`fixtures/teams.json` and `fixtures/matches.json` are a one-time snapshot of two
endpoints (each file records its `source` and `fetchedAt`). We commit the
snapshot rather than calling the API at seed time so the seed and its tests run
offline, with no token and no rate limit. `transform.ts` turns the snapshot into
database rows; `scripts/seed.ts` writes them.

## What the feed gives us

| Table           | Coverage                                                    |
| --------------- | ----------------------------------------------------------- |
| `national_team` | **Full** — all 48 nations, keyed by ISO-3 code.             |
| `player`        | **Full squads** — name and position for ~1,250 players.     |
| `match`         | **Group stage** — all 72 group fixtures with kickoff times. |

Two gaps are filled or deferred deliberately:

- **Player value.** Not a feed field. `transform.ts` derives a placeholder price
  from position + a hash of the player id (see `priceFor`). Deterministic, and
  spread enough that the 100m budget bites. Swap in real values later without
  touching anything else.
- **Knockout fixtures.** The feed lists all 104 matches, but the 32 knockout
  games have no teams until the bracket is drawn, so they cannot reference a
  nation yet. The seed skips them; re-seed after the group stage to fill them in.

## What the feed does _not_ give us

Per-match player events — **goals, assists, cards, and man-of-the-match** — are
not available on the free plan. The match resource returns only the final score;
the `/scorers` endpoint gives tournament totals, not per-match data. So
`player_match_stat` cannot be populated from this source, and automated scoring
(game-mechanics §6.4) needs either a paid data plan or a manual entry path. That
is why this seed stops at teams, players, and fixtures.

## Refreshing the snapshot

Re-fetch the two endpoints and overwrite the JSON (the `X-Auth-Token` header
takes a token from <https://www.football-data.org/client/register>; keep it in
`.env` as `FOOTBALL_DATA_TOKEN`, never commit it):

```sh
curl -H "X-Auth-Token: $FOOTBALL_DATA_TOKEN" \
  https://api.football-data.org/v4/competitions/WC/teams
curl -H "X-Auth-Token: $FOOTBALL_DATA_TOKEN" \
  https://api.football-data.org/v4/competitions/WC/matches
```

Keep only the fields the fixtures already use, then run `pnpm db:seed` again.
The free plan allows 10 requests/minute — watch the `X-Requests-Available-Minute`
response header.
