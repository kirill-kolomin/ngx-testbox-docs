---
sidebar_position: 3
---

# DebugElementHarness

A utility class that provides a convenient, type-safe API for interacting with elements in tests using test IDs.

This class simplifies querying for elements and performing common actions like clicking, focusing, reading text, and setting form values. It works with elements that have a test ID attribute (by default `data-test-id`, set by `TestIdDirective`).

## TestIdDirective

### Description

An Angular attribute directive that adds a `data-test-id` attribute to DOM elements for testing purposes.

### Usage

```html
<button testboxTestId="submit-button">Submit</button>
```

Renders as:
```html
<button data-test-id="submit-button">Submit</button>
```

### idsToMap

Converts an array of test IDs into a type-safe map:

```typescript
const testIds = ['submitButton', 'cancelButton'] as const;
const testIdMap = TestIdDirective.idsToMap(testIds);
// testIdMap = { submitButton: 'submitButton', cancelButton: 'cancelButton' }
```

Use it in templates with property binding:

```html
<button [testboxTestId]="testIdMap.submitButton">Submit</button>
```

---

## DebugElementHarness

### Constructor

```typescript
new DebugElementHarness<
  TestIds extends readonly string[]
>(
  debugElement: DebugElement,
  testIds: TestIds,
  testIdAttribute?: string   // default: 'data-test-id'
)
```

### Property: `elements`

A record keyed by each test ID, where each key exposes the element API:

```typescript
harness.elements.submitButton.click();
harness.elements.title.getTextContent();
```

---

## Element API

Each test ID exposes the following methods:

### `query(parentDebugElement?: DebugElement): DebugElement | null`

Queries for a single element with the test ID.

Returns the first matched `DebugElement`, or `null` if not found.

```typescript
const button = harness.elements.submitButton.query();
expect(button).not.toBeNull();
```

### `queryAll(parentDebugElement?: DebugElement): DebugElement[]`

Queries for all elements with the test ID.

Returns an array of matched `DebugElement` instances (empty array if none found).

```typescript
const items = harness.elements.todoItem.queryAll();
expect(items.length).toBe(3);
```

### `click(parentDebugElement?: DebugElement): void`

Clicks the element. Throws `NoElementByTestIdFoundError` if not found.

```typescript
harness.elements.submitButton.click();
```

### `focus(parentDebugElement?: DebugElement): void`

Focuses the element. Throws `NoElementByTestIdFoundError` if not found.

```typescript
harness.elements.searchInput.focus();
```

### `getTextContent(parentDebugElement?: DebugElement): string`

Returns the `textContent` of the element. Throws `NoElementByTestIdFoundError` if not found.

```typescript
const title = harness.elements.pageTitle.getTextContent();
expect(title).toContain('Welcome');
```

### `changeValue(value: string, parentDebugElement?: DebugElement): void`

Sets the value of a form element and dispatches a `change` event.
Throws `NoElementByTestIdFoundError` if not found.

```typescript
harness.elements.countrySelect.changeValue('DE');
```

### `inputValue(value: string, parentDebugElement?: DebugElement): void`

Sets the value of a form element and dispatches an `input` event.
Throws `NoElementByTestIdFoundError` if not found.

```typescript
harness.elements.searchBox.inputValue('query text');
```

---

## Scoping queries

All methods accept an optional `parentDebugElement` to search within a specific subtree:

```typescript
const listItem = harness.elements.todoItem.queryAll()[15];
const deleteButton = harness.elements.deleteButton.query(listItem);
```

---

## Custom test attribute

If you use a custom directive instead of `TestIdDirective`, pass your attribute name as the third constructor argument:

```typescript
const harness = new DebugElementHarness(
  fixture.debugElement,
  testIds,
  'data-testid'  // custom attribute
);
```

---

## Extending the harness

You can create a component-specific harness by extending `DebugElementHarness`:

```typescript
import {DebugElementHarness} from 'ngx-testbox/testing';
import {testIds} from './test-ids';

export class TodoHarness extends DebugElementHarness<typeof testIds> {
  constructor(debugElement: DebugElement) {
    super(debugElement, testIds);
  }

  setTodoInput(value: string): void {
    const input = this.elements.todoInput.query().nativeElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
}
```
