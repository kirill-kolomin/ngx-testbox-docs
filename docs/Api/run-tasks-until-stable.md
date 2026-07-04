---
sidebar_position: 2
---

# runTasksUntilStable

Runs Angular change detection and processes tasks until the component fixture is stable. **This function is designed to work only within a `fakeAsync` zone.**

It does the following operations:
1. Runs change detection.
2. Responds to HTTP requests.
3. Advances virtual time (`tick()`).
4. Runs the cycle again until the fixture is stable.

## Signature

```typescript
runTasksUntilStable(
  fixture: ComponentFixture<unknown>,
  params?: RunTasksUntilStableParams
): void
```

## Parameters

### `fixture`
The component fixture to stabilize.

### `params`
Optional configuration object:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `httpCallInstructions` | `HttpCallInstruction[]` | `[]` | Instructions for matching and responding to HTTP requests. |
| `stabilizationTimeAdvance` | `number` | **0** | Time in ms to advance the virtual clock on each stabilization attempt. This is cumulative across attempts. |
| `maxAttempts` | `number` | **30** | Maximum stabilization cycles before throwing. |
| `debug` | `boolean` | `false` | Logs warnings when `setInterval` is detected. |

## Throws

- `MaximumAttemptsToStabilizeFixtureReachedError` — when the fixture cannot stabilize within `maxAttempts` cycles.
- `HttpInstructionWasNotExecutedDuringFixtureStabilizationError` — when an instruction was never matched.
- `NoMatchingHttpInstructionForRequestFoundError` — when an HTTP request did not match any instruction.
- `CannotUsePromiseResponseWithinFakeAsync` — when a response getter returns a Promise.

## Example

```typescript
import {fakeAsync} from '@angular/core/testing';
import {runTasksUntilStable, predefinedHttpCallInstructions} from 'ngx-testbox/testing';

it('should load users', fakeAsync(() => {
  const fixture = TestBed.createComponent(UserListComponent);

  runTasksUntilStable(fixture, {
    httpCallInstructions: [
      predefinedHttpCallInstructions.get.success('/api/users', () => [
        {id: 1, name: 'Alice'},
      ]),
    ],
  });

  expect(fixture.componentInstance.users.length).toBe(1);
}));
```

## Remarks

- This function processes only HTTP requests made using Angular `HttpClient`.
- After calling `runTasksUntilStable`, the fixture is guaranteed to be stable.
- When `setInterval` is used inside the Angular zone, stabilization may fail. Use `debug: true` to detect it.
- `stabilizationTimeAdvance` is a per-attempt time step, not a one-time wait. For timer-driven flows, tune it together with `maxAttempts`.
- Rule of thumb: `stabilizationTimeAdvance * maxAttempts` should cover the debounce, throttle, or timer delay you need to flush.

---

## ResponseGetter (sync)

The function that generates an HTTP response. **Must be synchronous.**

```typescript
type ResponseGetter = (
  httpRequest: HttpRequest<unknown>,
  searchParams: URLSearchParams
) => HttpResponse<any>;
```

## HttpCallInstruction (sync)

A tuple defining how to match and respond to an HTTP request:

```typescript
type HttpCallInstruction =
  | [HttpCallChecker, ResponseGetter]
  | [HttpCallChecker, ResponseGetter, HttpCallInstructionExtraParams];
```

## HttpCallChecker

Matches an incoming HTTP request:

```typescript
type HttpCallChecker =
  | ((httpRequest: HttpRequest<unknown>) => boolean)
  | [EndpointPath, HttpMethod];
```
