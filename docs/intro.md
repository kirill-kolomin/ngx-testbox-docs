---
sidebar_position: 1
---

# Tutorial Intro

Let's discover **Ngx-testbox in less than 5 minutes**.

## Getting Started

Ngx-testbox is a tool that serves as a convenient way to perform integration testing of your components.
It handles common challenges that may occur in the way of testing features in black-box mode:
* Ngx-testbox responds to HTTP requests based on your defined HTTP call instructions.
* Ensures you're testing real component outcomes, unexpected behavior is flagged immediately.
* Gives you confidence that every part of your feature is covered
* Ngx-testbox provides a base Harness class for working with DOM elements (queries, focus, click, and getting text content).
* A directive serves for adding test id attribute to elements.
* Currently, it supports REST API. WebSocket and RPC support is under research.

## Install the package

```bash
npm install ngx-testbox
```

## Prepare your code base for the first test

### Define test ids

```typescript
import {TestIdDirective} from 'ngx-testbox';

export const testIds = ['submitButton', 'formError'] as const;
export const testIdMap = TestIdDirective.idsToMap(testIds);
```

### Set the ids on DOM elements

```html
<form [formGroup]="formGroup">
    <button [testboxTestId]="testIdMap.submitButton" (click)="submit()">Submit</button>
    
    <p *ngIf="errorFromServer" [testboxTestId]="testIdMap.formError">Error from server: {{errorFromServer}}</p>
</form>
```

### Write your first test case. Let's cover the error path of the component

```typescript
import { DebugElementHarness } from 'ngx-testbox/testing';
import { predefinedHttpCallInstructions, runTasksUntilStable } from 'ngx-testbox/testing';

describe('form group', () => {
    it('should hide error if there is no an error', () => {
        const harness = new DebugElementHarness(fixture.debugElement, testIds);
        const errorElement = harness.elements.formError.query();
        
        expect(errorElement).not.toBeDefined();
    })
    
    it('should display error in case of error in submit response', fakeAsync(async () => {
        const harness = new DebugElementHarness(fixture.debugElement, testIds);
        const accountNumberInput = harness.elements.accountNumber.query();
        const submitErrorProneFormValue = () =>
            predefinedHttpCallInstructions.post.error('https://DOMAIN/api/submitForm');
        
        harness.elements.submitButton.click();
        runTasksUntilStable(fixture, {httpCallInstructions: [submitErrorProneFormValue]});

        const errorElement = harness.elements.formError.query();

        expect(errorElement).toBeDefined();
    }))
})
```
