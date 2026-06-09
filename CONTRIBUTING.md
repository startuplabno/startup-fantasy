# Contributing to Startup Fantasy

Thanks for taking the time to contribute. This document covers how we work and
the engineering principles we hold each other to. They apply to everyone — read
them once, then keep them in the back of your head while you write code and
review PRs.

## Getting set up

See the [README](README.md) for prerequisites and local setup. In short:

```sh
pnpm install
cp .env.example .env   # then fill in BETTER_AUTH_SECRET
pnpm db:start          # in a separate terminal
pnpm db:push
pnpm dev
```

## Submitting changes

1. Make your change, following the principles below. Add or update tests.
2. Run `pnpm lint` and `pnpm check` — both must pass.
3. Open a pull request with a clear description of what changed and why.

Small, focused PRs get reviewed and merged faster than large ones. If a change
is big, open an issue first so we can agree on the approach.

## Engineering principles

These are the things we care about. They are not bureaucracy — each one exists
to keep the codebase easy to change as it grows.

### Keep it simple

Watch Rich Hickey's [_Simple Made
Easy_](https://www.youtube.com/watch?v=SxdOUGdseq4) if you haven't. The core
idea: **simple** (one concept, not interleaved with others) is a property of
the thing itself, while **easy** (familiar, close at hand) is about you. We
optimise for simple, even when it is not the easiest thing to type.

In practice:

- Prefer code that does one thing over code that does several things at once.
- Untangle concerns that don't belong together. A function that fetches,
  validates, and renders is three things wearing one hat.
- Reach for the boring, obvious solution before the clever one. Clever code is
  a loan against future understanding.

### Locality of behavior

Code that changes together should live together. When you read a piece of code,
you should be able to understand what it does without jumping across ten files.

- Keep behavior close to where it is used. Co-locate the handler, its types,
  and its helpers rather than scattering them by "kind".
- Prefer a small amount of obvious duplication over a far-away abstraction that
  couples unrelated callers.
- A reader should be able to predict what a unit does from its name and its
  surroundings.

### Use the relevant NASA Rules (Power of Ten)

We borrow the parts of NASA/JPL's [Power of
Ten](https://spinroot.com/gerard/pdf/P10.pdf) that fit a web app:

- **Keep control flow simple.** No surprising recursion, no clever flow
  constructs. Loops with clear, finite bounds.
- **Keep functions short.** A function should fit on a screen and do one job.
  If it doesn't fit, it's doing too much.
- **Limit the scope of data.** Declare things in the smallest scope that works.
  The fewer places that can touch state, the fewer places a bug can hide.
- **Check return values and handle errors.** Don't ignore a `Result`, a thrown
  error, or a promise rejection. If you intentionally ignore something, say so in
  code.

### Use assertions to catch programming errors

Assertions document and enforce the invariants you believe are true. They turn
"this should never happen" into a loud, immediate failure instead of corrupted
state three layers down.

- Assert on programming errors — things that should be impossible if the code
  is correct (a non-null value that is somehow null, an exhausted switch reaching
  a default, an index out of range).
- Do **not** use assertions for expected runtime conditions like bad user input
  or a failed network call. Those are normal control flow — validate and handle
  them.
- An assertion should have no side effects. It either holds or it crashes.

### Write integration tests

We favour tests that exercise real behavior across units over tests that mock
everything around a single function. An integration test that drives a route
through to the database tells you the feature works; a unit test with five
mocks tells you the mocks agree with each other.

- Test at the boundary a user (or another system) actually touches: a route, an
  endpoint, a flow.
- Use [Playwright](https://playwright.dev/) for end-to-end flows and
  [Vitest](https://vitest.dev/) for focused logic.
- Unit tests are still welcome for pure, tricky logic — just don't let mocks
  become the thing under test.

### Value explicit over implicit

Make intent visible. The reader should not have to infer what the code does
from side effects or convention.

- Prefer explicit arguments and return types over hidden globals and ambient
  state.
- Name things for what they are. Avoid magic numbers and unexplained constants.
- Make the unusual obvious. If something is surprising, a one-line comment
  explaining _why_ (not _what_) is worth it.
- Be explicit about errors and edge cases rather than letting them fall through
  silently.
