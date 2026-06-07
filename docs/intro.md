---
sidebar_position: 1
---

# Tutorial Intro

Let's discover **Ngx-testbox in less than 5 minutes**.

## Getting Started

Ngx-testbox is a tool that serves as a convenient way to perform integration testing of your Angular components.

It handles common challenges that may occur in the way of testing features in black-box mode:

- Ngx-testbox responds to HTTP requests based on your defined HTTP call instructions.
- Ensures you're testing real component outcomes, unexpected behavior is flagged immediately.
- Gives you confidence that every part of your feature is covered.
- Ngx-testbox provides a base Harness class for working with DOM elements (queries, focus, click, and getting text content).
- A directive serves for adding test id attribute to elements.
- Currently, it supports REST API. Compatible with GraphQL, but you have to mock response wrappers by yourself. WebSocket support is under research

## Install the package

```bash
npm install ngx-testbox
```

## Prepare your code base for the first test

### Define test ids

The following example uses the [`TestIdDirective`](api/debug-element-harness.md) to create test IDs for your components.

```typescript
import {TestIdDirective} from 'ngx-testbox';

export const testIds = ['submitButton', 'formError', 'accountNumber'] as const;
export const testIdMap = TestIdDirective.idsToMap(testIds);
```

### Set the ids on DOM elements

```html
<form [formGroup]="formGroup">
    <input [testboxTestId]="testIdMap.accountNumber" formControlName="accountNumber" />
    <button [testboxTestId]="testIdMap.submitButton" (click)="submit()">Submit</button>

    <p *ngIf="errorFromServer" [testboxTestId]="testIdMap.formError">Error from server: {{errorFromServer}}</p>
</form>
```

### Write your first test case. Let's cover the error path of the component

The following example uses several key APIs from ngx-testbox:

- [`DebugElementHarness`](api/debug-element-harness.md) - A utility class for interacting with elements in tests
- [`predefinedHttpCallInstructionsAsync`](api/predefined-http-call-instructions.md) - Shortcuts for common HTTP call instructions for the async/await approach
- [`runTasksUntilStableAsync`](api/run-tasks-until-stable-async.md) - A function that runs Angular change detection and processes tasks until the component fixture is stable

:::info
The example below uses the **async/await approach**, which is the recommended default for new tests. It works with both zoneful and zoneless Angular applications.

If you prefer the classic `fakeAsync` style, see the [sync approach](approaches/sync-approach.md).
:::

```typescript
import {
    predefinedHttpCallInstructionsAsync,
    runTasksUntilStableAsync,
    DebugElementHarness
} from 'ngx-testbox/testing';

describe('form group', () => {
    let harness: DebugElementHarness<typeof testIds>;

    beforeEach(() => {
        // Setup TestBed and component...
        harness = new DebugElementHarness(fixture.debugElement, testIds);
    });

    it('should hide error initially', () => {
        const errorElement = harness.elements.formError.query();
        expect(errorElement).toBeNull();
    });

    it('should display error in case of error in submit response', async () => {
        const submitErrorProneFormValue = predefinedHttpCallInstructionsAsync.post.error(
                'https://DOMAIN/api/submitForm',
                () => 'Incorrect format'
            );

        harness.elements.accountNumber.inputValue('S??SWR!!!FER$#$@QW');
        harness.elements.submitButton.click();
        await runTasksUntilStableAsync(fixture, {httpCallInstructions: [submitErrorProneFormValue]});

        expect(harness.elements.formError.query()).toBeDefined();
        expect(harness.elements.formError.getTextContent()).toBe('Error from server: Incorrect format');
    });
});
```
