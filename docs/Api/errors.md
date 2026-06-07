---
sidebar_position: 6
---

# Errors

All errors thrown by `ngx-testbox` extend the native `Error` class. You can import them from `ngx-testbox/testing` to perform `instanceof` checks in your tests.

## Error reference table

| Error Class | Thrown By | When It Happens | How To Fix |
|-------------|-----------|-----------------|------------|
| `LongRunningComponentError` | `runTasksUntilStableAsync` | Component did not stabilize within `componentLongRunTimeout` (default: **10000ms**). | Increase `componentLongRunTimeout`, or check for leaked timers / `setInterval`. |
| `MaximumAttemptsToStabilizeFixtureReachedError` | `runTasksUntilStable` | Stabilization loop exceeded `maxAttempts` (default: **30**). Usually caused by `setInterval`. | Mock `setInterval` or run it outside Angular zone. Use `debug: true` to locate it. |
| `NoMatchingHttpInstructionForRequestFoundError` | Both | An HTTP request was made that did not match any instruction. | Add the missing instruction to `httpCallInstructions`. |
| `HttpInstructionWasNotExecutedDuringFixtureStabilizationError` | Both | An instruction was provided but no matching request was ever made. | Remove the unused instruction, or verify your component triggers the expected request. |
| `HttpInstructionTimelineExceededError` | Both | A `timeline` was set for an instruction but `timePassed` already exceeded it. | Check timeline ordering; use `delay` instead if relative timing is sufficient. |
| `ConflictingHttpInstructionParamsError` | Both | Both `delay` and `timeline` were specified on the same instruction. | Remove one of the conflicting parameters. |
| `FailedToGenerateHttpResponseError` | Both | The `responseGetter` function threw an exception. | Fix the response getter logic so it does not throw. |
| `CannotUsePromiseResponseWithinFakeAsync` | `runTasksUntilStable` | A sync response getter returned a `Promise`. | Use `runTasksUntilStableAsync` instead, or make the getter synchronous. |
| `NoElementByTestIdFoundError` | `DebugElementHarness` | `click()`, `focus()`, `getTextContent()`, `changeValue()`, or `inputValue()` was called on a missing element. | Ensure the matching element exists in the current DOM state. |

## Example: catching errors in tests

```typescript
import {
  runTasksUntilStableAsync,
  LongRunningComponentError,
  NoMatchingHttpInstructionForRequestFoundError,
} from 'ngx-testbox/testing';

it('should time out on infinite async', async () => {
  try {
    await runTasksUntilStableAsync(fixture, {
      componentLongRunTimeout: 100,
    });
    fail('Expected LongRunningComponentError');
  } catch (e) {
    expect(e).toBeInstanceOf(LongRunningComponentError);
  }
});
```

## Error class interfaces

All error classes accept constructor-specific parameters and expose a descriptive `message`.

```typescript
class LongRunningComponentError extends Error {
  constructor(longRunningTimeoutMs: number);
}

class MaximumAttemptsToStabilizeFixtureReachedError extends Error {
  constructor(maximumAttempts: number);
}

class NoMatchingHttpInstructionForRequestFoundError extends Error {
  constructor(requestUrl: string, requestMethod: string);
}

class HttpInstructionWasNotExecutedDuringFixtureStabilizationError extends Error {
  constructor(index: number, instruction: string);
}

class HttpInstructionTimelineExceededError extends Error {
  constructor(timeline: number, currentTime: number);
}

class ConflictingHttpInstructionParamsError extends Error {
  constructor();
}

class FailedToGenerateHttpResponseError extends Error {
  constructor(genuineError: any);
}

class CannotUsePromiseResponseWithinFakeAsync extends Error {
  constructor();
}

class NoElementByTestIdFoundError extends Error {
  constructor(testId: string);
}
```
