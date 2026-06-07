---
sidebar_position: 1
---

# Choosing your approach

Ngx-testbox provides two approaches for stabilizing Angular tests. This page helps you decide which one to use.

---

## Recommendation

**Use the async/await approach for all new tests.**

It is simpler, works with or without `zone.js`, and aligns with the direction of modern Angular.

:::info
The async/await approach can run in **both zoneful and zoneless** Angular applications.
You do not need to be on zoneless to adopt it.
:::

---

## Comparison

| Feature | Async/await (recommended) | fakeAsync |
|---------|--------------------------|-----------|
| Entry point | `runTasksUntilStableAsync` | `runTasksUntilStable` |
| Test wrapper | `async () => { ... }` | `fakeAsync(() => { ... })` |
| Timer model | Real time or fake timer callback | Virtual time via `tick()` |
| Response getters | Sync **or** async (Promise) | Sync only |
| HTTP instructions helper | `predefinedHttpCallInstructionsAsync` | `predefinedHttpCallInstructions` |
| Zone.js support | Works with or without `zone.js` | Requires `zone.js` |
| Error on timeout | `LongRunningComponentError` | `MaximumAttemptsToStabilizeFixtureReachedError` |
| Preferred for | New code, zoneless apps, modern Angular | Legacy zoneful apps, strict virtual time control |

---

## When to choose async/await

- You are writing **new tests**.
- Your app is **zoneless** or migrating toward zoneless.
- You want your response getters to perform async work (e.g. reading JSON files, awaiting helpers).
- You prefer `async/await` over `fakeAsync` / `tick()`.

See [Async approach →](async-approach.md)

---

## When to choose fakeAsync

- You are maintaining an existing test suite that already relies on `fakeAsync`.
- You need **deterministic virtual time** manipulation via `tick()`.
- Your application requires `zone.js` and you are not ready to adopt the async pattern yet.

See [Sync approach →](sync-approach.md)

---

## Can I mix both in the same project?

Yes. Each test can independently choose whichever approach fits best.
However, for consistency within a single spec file it is recommended to pick one.
