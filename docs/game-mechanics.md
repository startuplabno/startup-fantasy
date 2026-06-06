# PRD — World Cup Fantasy 2026

> **Status:** Draft for developer handoff **Version:** v1.0 **Last updated:**
> 2026-06-04

**How to read this doc:** Scan bold text and headers to navigate.

- `[DECISION]` = a choice made where the brief was vague — review and override.
- `[DATA DEPENDENCY]` = requires third-party World Cup data.
- `[OPTIONAL]` = build only if scoped in.
- Open Questions are tagged `[PRODUCT]` / `[TECH]` / `[DESIGN]` and flagged as
blocking or non-blocking.

---

## 1. Product Overview

**What it is:** A lightweight, web-based fantasy football game for the 2026
FIFA World Cup. Each player drafts a starting XI from real World Cup squads
under a budget cap, locks it before kickoff, and accumulates points across the
whole tournament. One global leaderboard, one shared instance.

**Who it's for:** The Oslo business community — thousands of people across
multiple companies, from die-hard football fans to casual watchers who want in
on the fun around Norway's participation.

**Why it exists:** To create a shared, low-friction social game that ties the
Oslo professional crowd together around the World Cup. Casual sign-up, no
purchase, no per-company silos — every individual player (user) competes in one
league.

**Core loop:** Sign up → draft 11 players within budget and positional rules →
lock before the first match → watch points accrue automatically → track
standing on the global leaderboard.

**Defining constraint:** Simplicity. This is a casual game, not a hardcore
fantasy platform. Every mechanic below is deliberately minimal.

## 2. Goals

Measurable outcomes for v1. Targets are starting assumptions — adjust to your
reach.

- **Sign-up volume:** ≥ 1,000 registered users before squad-lock deadline.
- **Completion rate:** ≥ 80% of registered users submit a valid, locked XI
(registration without a team is the main drop-off risk — measure it).
- **Engagement:** ≥ 50% of locked users return to view the leaderboard at least
3 separate days during the group stage.
- **Retention through tournament:** ≥ 40% of locked users view the leaderboard
at least once during the knockout stage.
- **Integrity:** Zero duplicate-identity teams on the leaderboard (one team per
real person).

## 3. Non-Goals

Explicit exclusions for v1, with rationale.

- **No per-company leagues or segmentation** — brief specifies a single shared
instance; segmentation adds data-model and UI complexity for no v1 value.
- **No real money, prizes, or payments** — casual, no-purchase game; payments
introduce legal, tax, and gambling-regulation exposure (relevant in Norway).
- **No live in-match scoring / second-by-second updates** — points settle per
match after official data is available; live polling is costly and complexity
the casual audience doesn't need.
- **No native mobile app** — mobile-friendly web only.
- **No admin/commissioner tooling** — confirmed out of scope; scoring is
automated from the data feed.
- **No social feed, chat, or trash-talk features** — out of scope for v1,
parked.

## 4. User Roles

**Player** (the only human role in v1): Anyone who signs up. Can create exactly
one team, create a custom name for their team, draft an XI, lock it, and view
the leaderboard. No editing after lock (except via the optional transfers
module).

**System / Scoring Service** (automated, not a human): Ingests official World
Cup match and player data, computes points per the scoring table, updates the
leaderboard. No human admin role exists in v1 — there is no in-app override UI.

> `[DECISION]` No admin user role, per your confirmation. Implication to accept
> or override: if the data feed reports a wrong stat (e.g. a misattributed
> goal), there is no in-app way to correct it. **Mitigation:** keep scoring
> recomputable from raw stored match data so a developer can patch and re-run
> via a script. Flagged as a blocking open question below.

## 5. User Stories

### Player — Onboarding & Team Creation

- As a new user, I want to sign up in seconds so that I can join without
friction.
- As a player, I want to draft 11 players within a budget so that team-building
feels strategic but constrained.
- As a player, I want a "randomize my team" button so that I can get a valid XI
instantly if I don't want to think about it.
- As a player, I want clear, real-time validation (budget left, positions
filled, ownership caps) so that I always know whether my team is legal.
- As a player, I want to lock my team and get confirmation so that I know I'm
entered.
- As a player, I want to name my team and allow for funny, creative names.

### Player — During the Tournament

- As a player, I want my points to update automatically after each match so
that I don't have to do anything.
- As a player, I want to see the global leaderboard and my own rank so that I
know how I'm doing.
- As a player, I want to see a breakdown of how my XI scored so that the
scoring feels transparent.

### Player — Transfers `[OPTIONAL]`

- As a player, I want a small number of transfers each week so that I can react
to injuries and form without rebuilding my whole team. Or, introduce a transfer
window after each major round, group stage, second round, quarter final, etc.

## 6. Game Mechanics Specification

This is the authoritative rules document. Build to this exactly.

### 6.1 Squad composition

Each team is exactly **11 players** — a starting XI. No bench, no substitutes.

Players are drafted from real 2026 World Cup squads. `[DATA DEPENDENCY]` — full
squad lists for all 48 nations, with position and a per-player value.

**Positional constraints** (must total exactly 11):

| Position | Count     |
| -------- | --------- |
| GK       | exactly 1 |
| DEF      | 3–5       |
| MID      | 2–5       |
| FWD      | 1–3       |

Formation is **derived** from the selection, not chosen up front. Any
combination satisfying the ranges above is legal (e.g. 1-4-4-2, 1-3-5-2,
1-5-3-2, 1-4-3-3). The UI should validate against the ranges, not force a
preset formation.

**Players per team limitation.** No more than 3 players per national team can
be selected. This prevents users from selecting all the players from one team.

> `[DECISION]` Position is taken from the official squad data per player.
> Players who play multiple positions are assigned a single canonical position
> from the data feed; no multi-position eligibility in v1 (keeps validation
> simple).

### 6.2 Budget cap

Each team has a fixed budget of **100m**. `[DECISION]` — round number, easy
mental math.

Every real player has a value set by the data source or a manual pricing pass.
`[DATA DEPENDENCY]` / `[PRODUCT]` — see open questions; player pricing is not a
standard feed field and likely needs to be derived or hand-set.

A team is invalid if total value of the 11 selected players **exceeds** the
budget. Spending under budget is allowed.

### 6.3 Deadline & lock

All teams must be locked **before the first match** of the tournament kicks
off. `[DATA DEPENDENCY]` — official tournament start datetime.

After the deadline: no new teams, no edits (subject to the optional transfers
module). Unlocked/incomplete teams at the deadline do not appear on the
leaderboard.

> `[DECISION]` Users may lock early and re-edit freely until the deadline; only
> the state at the deadline is final. A team can also be auto-locked at the
> deadline if it's valid but the user never hit "lock."

### 6.4 Scoring table

Points settle per match once official data is available. A player scores in
every World Cup match their real team plays, for as long as that team remains
in the tournament.

| Event                         | GK  | DEF | MID | FWD |
| ----------------------------- | --- | --- | --- | --- |
| Goal scored                   | 8   | 6   | 5   | 4   |
| Assist                        | 3   | 3   | 3   | 3   |
| Clean sheet (team concedes 0) | 5   | 4   | —   | —   |
| Yellow card                   | −1  | −1  | −1  | −1  |
| Red card                      | −3  | −3  | −3  | −3  |
| Man of the Match              | +3  | +3  | +3  | +3  |

> `[DECISION]` Goal values weighted so defenders and keepers scoring goals is
> rare-but-rewarded, per your brief. Assists, cards, and MotM are flat across
> positions for simplicity. Clean sheet requires the player's real team to
> concede zero in that match — and `[DECISION]` only counts for GK/DEF (your
> brief), with no minutes-played requirement in v1 (we don't reliably get
> minutes from a casual feed — see open questions).

> `[DECISION]` — Appearance points deliberately excluded. Standard fantasy
> games award points just for playing. We omit this in v1 because it requires
> reliable minutes-played data; revisit if the feed supports it.

### 6.6 Leaderboard

Single **global leaderboard**. Every locked team competes in one league.

A team's total = sum of all its players' match points across the whole
tournament (group stage → final). `[DECISION]` — no Norway special-casing; all
48 nations treated identically.

Points accrue as matches settle; leaderboard reflects latest settled matches.

### 6.7 Tiebreaker

When two or more teams have equal total points, rank them by, in order:

1. Most goals scored by the team's selected players (sum across tournament).
2. Fewest cards (yellows + reds) accumulated by selected players.
3. Earliest lock timestamp (rewards committing early).

> `[DECISION]` Three-level tiebreaker so ties almost never reach a coin-flip.
> All three components are already stored for scoring, so no extra data needed.

### 6.8 Transfers `[OPTIONAL]`

Build only if explicitly scoped into the release. The locked-squad game must
work fully without this module.

- Players get **2 transfers per gameweek**. `[DECISION]` — a "gameweek" = one
round of the group stage, then each knockout round. `[PRODUCT]` — confirm
gameweek definition.
- A transfer = remove one player, add another, subject to all the same
constraints (budget, position ranges, ownership cap).
- Transfers lock at the start of each gameweek's first match. Unused transfers
`[DECISION]` do not roll over (keeps it simple; classic FPL-style rollover is a
parking-lot item).
- Points already scored by a transferred-out player are kept; the
transferred-in player scores only from the point of transfer onward.

## 7. Functional Requirements

Priorities: **P0** = must-have for launch · **P1** = strongly wanted, can
fast-follow · **P2** = nice-to-have. Acceptance criteria in Given/When/Then.

### P0 — Launch-blocking

#### FR-1 — Sign-up & identity

> `[DECISION]` Default to Google social login, with name + email (no password)
> as a documented fallback only if Google is rejected. Rationale: name+email
> cannot enforce one-team-per-person or stop joke entries (anyone can type any
> email); Google gives a verified unique identity for free. This affects Goal
> #5 (integrity).

- **Given** a new visitor, **when** they sign in with Google, **then** an
account is created tied to their Google identity and they can create one team.
- **Given** a returning user, **when** they sign in, **then** they see their
existing team or the draft screen.
- **Given** a user who already has a team, **when** they attempt to create a
second, **then** they are blocked and shown their existing team.

#### FR-2 — Team draft with live validation

- **Given** the draft screen, **when** the user adds a player, **then**
remaining budget, position counts, and total selected update in real time.
- **Given** a selection that breaks a rule (over budget, wrong position count,
player at ownership cap), **when** the user views it, **then** the violation is
shown inline and locking is disabled until resolved.
- **Given** a valid 11-player XI within all constraints, **when** the user
reviews it, **then** the "Lock" action is enabled.

#### FR-3 — Randomize team

- **Given** the draft screen, **when** the user taps "Randomize," **then** the
system generates a valid XI satisfying budget, position ranges, and ownership
caps.
- **Given** a randomized team, **when** it's generated, **then** the user can
still manually edit it before locking.

#### FR-4 — Lock team before deadline

- **Given** a valid team before the deadline, **when** the user taps "Lock,"
**then** the team state is frozen and a confirmation is shown.
- **Given** the deadline passes, **when** any user attempts to create or edit a
team, **then** the action is rejected.
- **Given** a valid team that was never manually locked, **when** the deadline
passes, **then** it is auto-locked and entered.

#### FR-5 — Automated scoring `[DATA DEPENDENCY]`

- **Given** a match has finished and official data is available, **when** the
scoring service runs, **then** each affected player's points are computed per
the scoring table and persisted.
- **Given** scoring has run for a match, **when** re-run with the same data,
**then** the result is identical (idempotent).
- **Given** corrected source data for an already-scored match, **when** scoring
is re-run, **then** totals recompute correctly (supports manual data patches
given no admin UI).

#### FR-6 — Global leaderboard

- **Given** settled match points, **when** a user opens the leaderboard,
**then** all locked teams are ranked by total points with tiebreakers applied.
- **Given** the leaderboard, **when** a logged-in user views it, **then** their
own rank and team are highlighted/quick-findable.

### P1 — Fast-follow

#### FR-7 — Per-team score breakdown

- **Given** a locked team, **when** the user opens it, **then** they see
per-player and per-match point contributions.

#### FR-8 — Mobile-responsive UI

- **Given** a mobile browser, **when** any screen loads, **then** layout and
interactions work without horizontal scroll or broken controls.

### P2 — Nice-to-have

#### FR-9 — Transfers module `[OPTIONAL]`

- **Given** transfers are enabled and a user has transfers remaining in the
current gameweek, **when** they swap a player within all constraints, **then**
the change is saved and the transfer count decrements.
- **Given** no transfers remaining, **when** the user attempts a swap, **then**
it is rejected.
- **Given** a transferred-out player who already scored, **when** totals are
computed, **then** prior points are retained and new points accrue only to the
incoming player from the transfer time.

## 8. Data Model Hints

Key entities and relationships — enough to plan, not a final schema.

- **User** — `id`, identity provider ref (Google `sub`), `display_name`,
`email`, `created_at`. One User → one Team.
- **Team** — `id`, `user_id`, `status` (draft / locked), `locked_at`,
`total_points` (derived/cached). One Team → 11 TeamSelections.
- **TeamSelection** — join between Team and Player: `team_id`, `player_id`,
`purchase_value`, (for transfers) `active_from`, `active_to`.
- **Player** — `id`, `name`, `national_team`, `position` (GK/DEF/MID/FWD),
`coin_value`, `ownership_count` (derived). `[DATA DEPENDENCY]`
- **NationalTeam** — `id`, `name`, tournament status (in / eliminated). Drives
which players are still active.
- **Match** — `id`, `home_team`, `away_team`, `kickoff_at`, `status`,
`gameweek`. `[DATA DEPENDENCY]`
- **PlayerMatchStat** — raw per-player-per-match facts from the feed:
`player_id`, `match_id`, `goals`, `assists`, `clean_sheet`, `yellows`, `reds`,
`motm`. Store raw stats separately from computed points so scoring stays
recomputable (critical given no admin UI).
- **PlayerMatchScore** — computed: `player_id`, `match_id`, `points`. Derived
from PlayerMatchStat × scoring table.
- **Config / Settings** — `budget_cap`, `ownership_cap_pct`, `deadline_at`,
`transfers_enabled`, `transfers_per_gameweek`. Keep tunable values in config,
not hardcoded.

**Relationships:** User 1—1 Team; Team 1—\* TeamSelection \*—1 Player; Player
\*—1 NationalTeam; Player 1—\* PlayerMatchStat; PlayerMatchStat 1—1
PlayerMatchScore; Match 1—\* PlayerMatchStat.

## 9. Open Questions

Tagged and flagged. **Blocking** = needed before build can sensibly start.

- `[PRODUCT]` **Player pricing** — where do values come from? Standard data
feeds don't supply fantasy values. Options: derive from a rating stat, or a
manual pricing pass before launch. **BLOCKING** — budget mechanic can't be
built or balanced without this.
- `[TECH]` **Which World Cup data provider?** Squads, fixtures, live results,
and per-player stats (goals/assists/cards/clean sheets/MotM). Cost, latency,
and coverage vary widely. **BLOCKING** — FR-5 and most of the game depend on
it. MotM in particular is not universally provided — confirm coverage.
- `[TECH]` **Scoring correction path with no admin UI.** If the feed misreports
a stat, how is it fixed? Recommended: store raw stats, patch via script, re-run
scoring. **BLOCKING** — decide before launch or accept uncorrectable errors.
- `[PRODUCT]` **Ownership-cap base.** Is 30% of currently locked teams (moving
target) acceptable, or do you want a fixed pre-announced cap count?
Non-blocking — default chosen (§6.3).
- `[PRODUCT]` **Gameweek definition for transfers** `[OPTIONAL]`. Confirm a
gameweek = each group round, then each knockout round. Non-blocking — only
matters if transfers ship.
- `[DESIGN]` **Eliminated-team handling in the UI.** When a nation is knocked
out, those players stop scoring. Show them greyed-out on the team view?
Non-blocking but affects perceived fairness/clarity.
- `[PRODUCT]` **Auth final call.** Confirm Google login over name+email
(§FR-1). Non-blocking but affects integrity goal — decide early.
- `[DESIGN]` **Clean sheet with no minutes data.** We award clean sheets to any
selected GK/DEF whose team concedes 0, even if they didn't play. Acceptable, or
do we need minutes filtering (adds a data dependency)? Non-blocking — default
chosen (§6.5).

## 10. Out of Scope / Parking Lot

Good ideas, explicitly not in v1.

- **Per-company sub-leagues / private leagues** — natural v2 if the Oslo crowd
wants office bragging rights.
- **Captain / vice-captain multipliers** — classic fantasy depth; adds scoring
complexity.
- **Bench & auto-subs** — explicitly excluded by the brief.
- **Transfer rollover & wildcards** — only relevant if the optional transfers
module ships and proves popular.
- **Live in-match scoring** — real-time feed and polling cost; settle-per-match
is enough for v1.
- **Social feed / chat / reactions** — engagement layer for later.
- **Prizes, payments, or entry fees** — out for legal and scope reasons.
- **Appearance/minutes-played points** — depends on minutes data; revisit if
the feed supports it.
- **Push/email notifications** ("your team scored!", "deadline soon") — strong
engagement lever, parked for v1.
