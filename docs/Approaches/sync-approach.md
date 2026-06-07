---
sidebar_position: 3
---

# fakeAsync approach

The classic sync approach uses Angular's `fakeAsync` zone with virtual time via `tick()`. It is fully supported and suitable for existing test suites that rely on `fakeAsync` and `zone.js`.

## Prerequisites

- Angular application with `zone.js` enabled.
- `fakeAsync` from `@angular/core/testing`.

## Basic structure of a test

```typescript
import {fakeAsync, TestBed} from '@angular/core/testing';
import {
  predefinedHttpCallInstructions,
  runTasksUntilStable,
  DebugElementHarness,
} from 'ngx-testbox/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

describe('MyComponent (sync)', () => {
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

  it('should display data on success', fakeAsync(() => {
    const mockData = [{id: 1, name: 'Item A'}];

    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.get.success('/api/items', () => mockData),
      ],
    });

    const items = harness.elements.item.queryAll();
    expect(items.length).toBe(1);
  }));
});
```

:::warning
Response getters within `fakeAsync` **must be synchronous**. If you need async response getters, use the [async/await approach](async-approach.md) instead.
:::

## HTTP call instructions

Use `predefinedHttpCallInstructions` to build instructions:

```typescript
// Success with no body
const getSuccess = predefinedHttpCallInstructions.get.success('/api/users');

// Success with custom body
const getWithBody = predefinedHttpCallInstructions.get.success(
  '/api/users',
  () => [{id: 1, name: 'Alice'}]
);

// Error response
const postError = predefinedHttpCallInstructions.post.error(
  '/api/submit',
  () => ({error: 'Validation failed'})
);
```

## Custom HTTP call instructions

If you need full control, define a raw `HttpCallInstruction` tuple:

```typescript
import {HttpCallInstruction, HttpResponse} from 'ngx-testbox/testing';

const customInstruction: HttpCallInstruction = [
  ['/api/search', 'GET'],                           // [EndpointPath, HttpMethod]
  (req, searchParams) => {                         // ResponseGetter (sync only)
    const query = searchParams.get('q') || '';
    return new HttpResponse({
      body: results.filter(r => r.title.includes(query)),
      status: 200,
    });
  },
  {delay: 200},                                    // Optional extra params
];
```

## Stabilization parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `httpCallInstructions` | `HttpCallInstruction[]` | `[]` | Instructions for matching and responding to HTTP requests. |
| `eventualTimeAdvance` | `number` | **1000** | Time in ms to advance the virtual clock at the end of each stabilization cycle. |
| `maxAttempts` | `number` | **30** | Maximum stabilization cycles before throwing `MaximumAttemptsToStabilizeFixtureReachedError`. |
| `debug` | `boolean` | `false` | Logs warnings when `setInterval` is detected during stabilization. |

## Periodic timers and setInterval

`fakeAsync` treats `setInterval` as a periodic timer. If it remains active, the fixture will never stabilize.

Options:
- Mock the `setInterval` usage.
- Run it outside Angular zone with `NgZone.runOutsideAngular(() => setInterval(...))`.

See [Troubleshooting](../troubleshooting.md) for more details.

## Error handling

- Unhandled HTTP request → `NoMatchingHttpInstructionForRequestFoundError`
- Unused HTTP instruction → `HttpInstructionWasNotExecutedDuringFixtureStabilizationError`
- Too many stabilization cycles → `MaximumAttemptsToStabilizeFixtureReachedError`
- Promise returned from response getter → `CannotUsePromiseResponseWithinFakeAsync`

See [Errors reference](../api/errors.md) for the full list.

## Full example: testing a component with fakeAsync

```typescript
import {ComponentFixture, TestBed, fakeAsync} from '@angular/core/testing';
import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {
  predefinedHttpCallInstructions,
  runTasksUntilStable,
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

describe('MyComponent (sync example)', () => {
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

  it('should render items after loading', fakeAsync(() => {
    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.get.success('/api/items', () => ({
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
  }));
});
```
