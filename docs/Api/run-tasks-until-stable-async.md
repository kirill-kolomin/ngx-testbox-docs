---
sidebar_position: 1
---

# runTasksUntilStableAsync

Runs Angular change detection and processes tasks until the component fixture is stable using `async/await`.

This is the **recommended default** for new tests. It works with both zoneful and zoneless Angular applications and supports asynchronous response getters (Promises).

It does the following operations:
1. Runs change detection.
2. Responds to HTTP requests.
3. Waits for the fixture to become stable (via real time or a fake timer callback).
4. Runs the cycle again until both the fixture is stable and no HTTP requests remain.

## Signature

```typescript
await runTasksUntilStableAsync(
  fixture: ComponentFixture<unknown>,
  params?: RunTasksUntilStableAsyncParams
): Promise<void>
```

## Parameters

### `fixture`
The component fixture to stabilize.

### `params`
Optional configuration object:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `httpCallInstructions` | `HttpCallInstructionAsync[]` | `[]` | Instructions for matching and responding to HTTP requests. |
| `advanceTimers` | `(delayMs: number) => void \| Promise<void>` | — | Callback to advance fake timers during stabilization. |
| `componentLongRunTimeout` | `number` | **10000** | Timeout in ms after which a `LongRunningComponentError` is thrown. |
| `debug` | `boolean` | `false` | Logs warnings when `setInterval` is detected. |

## Throws

- `LongRunningComponentError` — when the component does not stabilize within `componentLongRunTimeout`.
- `HttpInstructionWasNotExecutedDuringFixtureStabilizationError` — when an instruction was never matched.
- `NoMatchingHttpInstructionForRequestFoundError` — when an HTTP request did not match any instruction.

## Example

```typescript
import {runTasksUntilStableAsync, predefinedHttpCallInstructionsAsync} from 'ngx-testbox/testing';

it('should load users', async () => {
  const fixture = TestBed.createComponent(UserListComponent);

  await runTasksUntilStableAsync(fixture, {
    httpCallInstructions: [
      predefinedHttpCallInstructionsAsync.get.success('/api/users', () => [
        {id: 1, name: 'Alice'},
      ]),
    ],
  });

  expect(fixture.componentInstance.users.length).toBe(1);
});
```

## Using with fake timers

If your test uses fake timers, provide `advanceTimers` (example with Jasmine):

```typescript
it('should handle debounced input', async () => {
  jasmine.clock().install();

  await runTasksUntilStableAsync(fixture, {
    httpCallInstructions: [searchSuccess],
    advanceTimers: (ms) => jasmine.clock().tick(ms),
  });

  jasmine.clock().uninstall();
});
```

## Remarks

- This function processes only HTTP requests made using Angular `HttpClient`.
- Unlike `runTasksUntilStable`, this variant does **not** require `fakeAsync` and does not use `tick()`.
- Response getters may return a `Promise`.
- The timeout default is 10 seconds. Increase `componentLongRunTimeout` for slow-loading components.

---

## ResponseGetterAsync

The function that generates an HTTP response. May be synchronous or return a `Promise`.

```typescript
type ResponseGetterAsync = (
  httpRequest: HttpRequest<unknown>,
  searchParams: URLSearchParams
) => Promise<HttpResponse<any>> | HttpResponse<any>;
```

## HttpCallInstructionAsync

A tuple defining how to match and respond to an HTTP request in async mode:

```typescript
type HttpCallInstructionAsync =
  | [HttpCallChecker, ResponseGetterAsync]
  | [HttpCallChecker, ResponseGetterAsync, HttpCallInstructionExtraParams];
```
