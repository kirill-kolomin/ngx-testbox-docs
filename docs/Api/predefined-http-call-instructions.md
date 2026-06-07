---
sidebar_position: 4
---

# Predefined HTTP call instructions

`ngx-testbox` ships with two helper objects that generate common `HttpCallInstruction` tuples for you. They save boilerplate by automatically assigning status codes (`200 OK` or `500 Internal Server Error`) and status text.

It is recommended to import the object that matches your stabilization approach:

| Approach | Import |
|----------|--------|
| **Async/await** | `predefinedHttpCallInstructionsAsync` |
| **fakeAsync** | `predefinedHttpCallInstructions` |

---

## predefinedHttpCallInstructionsAsync

Returns `HttpCallInstructionAsync` (response getter may be a `Promise`).

```typescript
import {predefinedHttpCallInstructionsAsync} from 'ngx-testbox/testing';
```

### Shape

```typescript
predefinedHttpCallInstructionsAsync[method][status](path, responseGetter?)
```

- **`method`**: `head` | `options` | `get` | `post` | `put` | `patch` | `delete`
- **`status`**: `success` (200) | `error` (500)
- **`path`**: `string | RegExp` (endpoint or pattern)
- **`responseGetter`**: Optional function that returns the response body or a complete `HttpResponse`.

### Examples

```typescript
// Basic success — empty body
predefinedHttpCallInstructionsAsync.get.success('/api/users');

// Success with body
predefinedHttpCallInstructionsAsync.get.success('/api/users', () => [
  {id: 1, name: 'Alice'},
]);

// Error with body
predefinedHttpCallInstructionsAsync.post.error('/api/submit', () => ({
  message: 'Validation failed',
}));

// Async response getter (Promise is allowed)
predefinedHttpCallInstructionsAsync.get.success('/api/config', async () => {
  const config = await loadFixture('config.json');
  return config;
});

// Regex path
predefinedHttpCallInstructionsAsync.get.success(
  new RegExp('/api/users/\\d+'),
  () => ({id: 1, name: 'Alice'})
);
```

---

## predefinedHttpCallInstructions

Returns `HttpCallInstruction` (response getter **must** be synchronous).

```typescript
import {predefinedHttpCallInstructions} from 'ngx-testbox/testing';
```

### Shape

```typescript
predefinedHttpCallInstructions[method][status](path, responseGetter?)
```

### Examples

```typescript
// Basic success
predefinedHttpCallInstructions.get.success('/api/users');

// Success with body
predefinedHttpCallInstructions.get.success('/api/users', () => [
  {id: 1, name: 'Alice'},
]);

// Error response
predefinedHttpCallInstructions.delete.error('/api/users/1');
```

:::warning
Response getters passed here must be **synchronous**. Returning a `Promise` will throw `CannotUsePromiseResponseWithinFakeAsync`.
:::

---

## Response getter signature

```typescript
(httpRequest: HttpRequest<unknown>, searchParams: URLSearchParams) =>
  any | HttpResponse<any> | Promise<any> | Promise<HttpResponse<any>>
```

If you return a plain value, it becomes the response body. If you return an `HttpResponse`, its body, headers, and status are used.

### Using request data

```typescript
predefinedHttpCallInstructionsAsync.get.success('/api/search', (req, searchParams) => {
  const query = searchParams.get('q') || '';
  const results = allItems.filter(item => item.name.includes(query));
  return {results};
});
```

---

## Differences from raw HttpCallInstruction

The predefined helpers are sugar over the raw tuple:

```typescript
// Using predefined helper
predefinedHttpCallInstructionsAsync.get.success('/api/users', () => users);

// Equivalent raw instruction
const instruction: HttpCallInstructionAsync = [
  ['/api/users', 'GET'],
  () => new HttpResponse({body: users, status: 200}),
];
```

The helper wraps your return value into an `HttpResponse` and sets the status code automatically.
