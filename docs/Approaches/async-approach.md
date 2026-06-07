---
sidebar_position: 2
---

# Async/await approach

This is the **recommended default** for new tests. It uses `async/await` and `runTasksUntilStableAsync`, works with both zoneful and zoneless Angular applications, and supports both synchronous and asynchronous response getters.

## Prerequisites

- Angular application with `HttpClient` and `HttpClientTestingModule` configured.
- Test environment that supports `async/await` (standard in Jasmine, Jest, Vitest).

## Basic structure of a test

```typescript
import {
  predefinedHttpCallInstructionsAsync,
  runTasksUntilStableAsync,
  DebugElementHarness,
} from 'ngx-testbox/testing';
import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

describe('MyComponent (async)', () => {
  let fixture: ComponentFixture<MyComponent>;
  let harness: DebugElementHarness<typeof testIds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should display data on success', async () => {
    const mockData = [{id: 1, name: 'Item A'}];

    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.get.success('/api/items', () => mockData),
      ],
    });

    const items = harness.elements.item.queryAll();
    expect(items.length).toBe(1);
  });
});
```

## HTTP call instructions

Use `predefinedHttpCallInstructionsAsync` to quickly build instructions:

```typescript
// Success with no body
const getSuccess = predefinedHttpCallInstructionsAsync.get.success('/api/users');

// Success with custom body
const getWithBody = predefinedHttpCallInstructionsAsync.get.success(
  '/api/users',
  () => [{id: 1, name: 'Alice'}]
);

// Error response
const postError = predefinedHttpCallInstructionsAsync.post.error(
  '/api/submit',
  () => ({error: 'Validation failed'})
);

// Async response getter (Promise is allowed)
const asyncResponse = predefinedHttpCallInstructionsAsync.get.success(
  '/api/config',
  async () => {
    const config = await loadRemoteOrAsyncResources();
    return config;
  }
);
```

## Custom HTTP call instructions

If you need full control, define a raw `HttpCallInstructionAsync` tuple:

```typescript
import {HttpCallInstructionAsync, HttpResponse} from 'ngx-testbox/testing';

const customInstruction: HttpCallInstructionAsync = [
  ['/api/search', 'GET'],                           // [EndpointPath, HttpMethod]
  (req, searchParams) => {                         // ResponseGetterAsync
    const query = searchParams.get('q') || '';
    return new HttpResponse({
      body: results.filter(r => r.title.includes(query)),
      status: 200,
    });
  },
  {delay: 1200},                                    // Optional extra params
];
```

## Stabilization parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `httpCallInstructions` | `HttpCallInstructionAsync[]` | `[]` | Instructions for matching and responding to HTTP requests. |
| `advanceTimers` | `(delayMs: number) => void \| Promise<void>` | — | Callback to advance fake timers (Jasmine, Vitest, etc.). |
| `componentLongRunTimeout` | `number` | **10000** | Timeout in ms after which a `LongRunningComponentError` is thrown. |
| `debug` | `boolean` | `false` | Logs warnings when `setInterval` is detected during stabilization. |

## Advancing timers with fake timers

If your test environment uses fake timers (e.g. `jasmine.clock().install()`), provide the `advanceTimers` callback:

```typescript
it('should handle debounced search', async () => {
  await runTasksUntilStableAsync(fixture, {
    httpCallInstructions: [searchSuccess],
    advanceTimers: (ms) => jasmine.clock().tick(ms),
  });
});
```

## Error handling

The async approach throws on the same conditions as the sync approach:

- Unhandled HTTP request → `NoMatchingHttpInstructionForRequestFoundError`
- Unused HTTP instruction → `HttpInstructionWasNotExecutedDuringFixtureStabilizationError`
- Timeout → `LongRunningComponentError`

See [Errors reference](../api/errors.md) for the full list.

## Full example: testing a component with async/await

```typescript
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {
  predefinedHttpCallInstructionsAsync,
  runTasksUntilStableAsync,
  DebugElementHarness,
} from 'ngx-testbox/testing';
import {TestIdDirective} from 'ngx-testbox';

const testIds = ['title', 'itemList', 'item'] as const;
const testIdMap = TestIdDirective.idsToMap(testIds);

@Component({
  standalone: true,
  imports: [TestIdDirective],
  template: `
    <h1 [testboxTestId]="testIdMap.title">{{ title }}</h1>
    <ul [testboxTestId]="testIdMap.itemList">
      @for (item of items; track item.id) {
        <li [testboxTestId]="testIdMap.item">{{ item.name }}</li>
      }
    </ul>
  `,
})
class MyComponent {
  testIdMap = testIdMap;
  title = 'My List';
  items: {id: number; name: string}[] = [];

  constructor(http: HttpClient) {
    http.get<{items: {id: number; name: string}[]}>('/api/items').subscribe((res) => {
      this.items = res.items;
    });
  }
}

describe('MyComponent (async example)', () => {
  let fixture: ComponentFixture<MyComponent>;
  let harness: DebugElementHarness<typeof testIds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should render items after loading', async () => {
    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.get.success('/api/items', () => ({
          items: [
            {id: 1, name: 'First'},
            {id: 2, name: 'Second'},
          ],
        })),
      ],
    });

    expect(harness.elements.title.getTextContent()).toBe('My List');

    const items = harness.elements.item.queryAll();
    expect(items.length).toBe(2);
    expect(harness.elements.item.getTextContent(items[0])).toContain('First');
    expect(harness.elements.item.getTextContent(items[1])).toContain('Second');
  });
});
```
