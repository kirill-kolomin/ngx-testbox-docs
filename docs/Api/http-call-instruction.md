---
sidebar_position: 5
---

# HttpCallInstruction types

These types define the shape of HTTP call instructions used by `runTasksUntilStable` and `runTasksUntilStableAsync`.

They are exported from `ngx-testbox/testing` so you can build your own typed helpers and custom instructions.

---

## HttpCallInstruction

Used with `runTasksUntilStable` (fakeAsync). The response getter must be synchronous.

```typescript
type HttpCallInstruction =
  | [HttpCallChecker, ResponseGetter]
  | [HttpCallChecker, ResponseGetter, HttpCallInstructionExtraParams];
```

## HttpCallInstructionAsync

Used with `runTasksUntilStableAsync` (async/await). The response getter may return a `Promise`.

```typescript
type HttpCallInstructionAsync =
  | [HttpCallChecker, ResponseGetterAsync]
  | [HttpCallChecker, ResponseGetterAsync, HttpCallInstructionExtraParams];
```

---

## HttpCallChecker

Determines whether an incoming `HttpRequest` matches the instruction.

```typescript
type HttpCallChecker =
  | ((httpRequest: HttpRequest<unknown>) => boolean)
  | [EndpointPath, HttpMethod];
```

### Tuple form

```typescript
['/api/users', 'GET']
[new RegExp('/api/users/\\d+'), 'GET']
```

### Function form

```typescript
(req) => req.url.includes('/api/users') && req.method === 'GET'
```

---

## EndpointPath

```typescript
type EndpointPath = string | RegExp;
```

When using a string, the request URL is checked with `.includes()`. When using a `RegExp`, `.match()` is used.

:::info
Define the most specific URLs closer to the beginning of the http instructions array. The resolving process for URLs goes from first to last instruction.
:::

## HttpMethod

```typescript
type HttpMethod = string;
```

Standard HTTP methods: `'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`.

---

## ResponseGetter

Synchronous response getter. Required for the fakeAsync approach.

```typescript
type ResponseGetter = (
  httpRequest: HttpRequest<unknown>,
  searchParams: URLSearchParams
) => HttpResponse<any>;
```

## ResponseGetterAsync

Asynchronous response getter. Allowed only with the async/await approach.

```typescript
type ResponseGetterAsync = (
  httpRequest: HttpRequest<unknown>,
  searchParams: URLSearchParams
) => Promise<HttpResponse<any>> | HttpResponse<any>;
```

---

## HttpCallInstructionExtraParams

Optional third tuple element for fine-grained control.

```typescript
type HttpCallInstructionExtraParams = {
  delay?: number;              // Virtual/real delay before responding (ms)
  timeline?: number;           // Absolute timeline time point for response (ms)
  onCompleted?: () => void;    // Callback invoked after instruction is processed
  willHaveBeenCancelled?: boolean; // Marks request as expected to be cancelled
  sustainable?: boolean;       // If true, instruction persists for multiple requests
};
```

### `delay`

Delays the response by the given number of milliseconds. In `fakeAsync`, this translates to a `tick()` call. In async mode, this uses a real `setTimeout` or is passed to the `advanceTimers` callback.

### `timeline`

Sets an absolute time point for the response, starts counting separatelly for each call of runTasksUntilStable or runTasksUntilStableAsync.
If time passed since a stabilization call is grater than a timeline defined for an instruction, an `HttpInstructionTimelineExceededError` is thrown. In other words if request B has happened with timeline 3000 and then request A happened with timeline 2000, the error is thrown.

:::warning
`delay` and `timeline` are mutually exclusive. Specifying both throws `ConflictingHttpInstructionParamsError`.
:::

### `sustainable`

By default, each instruction is consumed after one match. Mark it `sustainable: true` to reuse it across multiple HTTP requests during the same stabilization process.

### `willHaveBeenCancelled`

When a test expects an HTTP request to be cancelled (e.g. by `switchMap`), set this flag. The instruction is considered "invoked" even if the request is cancelled.

### `onCompleted`

A callback invoked after the instruction is processed. Useful for intermediate assertions between request rounds:

```typescript
[
  ['/api/first', 'GET'],
  () => new HttpResponse({body: {value: 'first'}}),
  {
    onCompleted: () => {
      expect(harness.elements.status.getTextContent()).toBe('first');
    },
  },
]
```

Might be also used for testing edge cases to make user actions right after an instruction was completed:

```typescript
[
  ['/api/optionA', 'GET'],
  () => new HttpResponse({body: {value: 'first'}}),
  {
    onCompleted: () => {
      harness.elements.optionB.click();
    },
  },
  // ... subsequent calls that are applicable for the optionB
]
```

---

## Helper types

These are re-exported for typed custom builders:

| Type | Description |
|------|-------------|
| `DelayTime` | Alias for `number` in milliseconds |
| `TimelineTime` | Alias for `number` in milliseconds |
| `OnCompleted` | `() => void` callback after instruction execution |
