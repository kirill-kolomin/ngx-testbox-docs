---
sidebar_position: 2
---

# API definition

## HttpMethod

Represents an HTTP method (GET, POST, PUT, DELETE, etc.).

**Example:**

```typescript
export type HttpMethod = string;
```

## EndpointPath

Represents an endpoint path that can be either a string or a regular expression.

- String: Exact or partial match for the URL
- RegExp: Pattern match for the URL

**Example:**

```typescript
export type EndpointPath = string | RegExp;
```

## ResponseGetter

A function that generates an HTTP response based on the request and URL search parameters.

**Parameters:**

- `httpRequest` - The original HTTP request
- `searchParams` - The parsed URL search parameters from the request

**Returns:** An HTTP response object to be returned for the request

**Example:**

```typescript
export type ResponseGetter = (
    httpRequest: HttpRequest<unknown>,
    searchParams: URLSearchParams
) => HttpResponse<unknown>;
```

## HttpCallChecker

A checker that determines if a specific HTTP request matches with a provided http call instruction for further handling.
Can be either:

- A function that takes an HTTP request and returns a boolean
- A tuple containing an endpoint path and HTTP method

**Example:**

```typescript
export type HttpCallChecker =
    ((httpRequest: HttpRequest<unknown>) => boolean) |
    [EndpointPath, HttpMethod];
```

## HttpCallInstruction

A tuple containing an HTTP call checker and a response getter function.
Used to define how to handle specific HTTP requests during testing.

**Example:**

```typescript
export type HttpCallInstruction = [HttpCallChecker, ResponseGetter]
```

## runTasksUntilStable

Runs Angular change detection and processes tasks until the component fixture is stable.
This function is designed to help with testing asynchronous operations in Angular components.

The function repeatedly runs change detection and advances the virtual clock until the fixture
is stable. It also handles HTTP requests if instructions are provided. If the fixture cannot
be stabilized after a maximum number of attempts, an error is thrown.

**Parameters:**

- `fixture` - The component fixture to stabilize
- `params.iterationMs = 1000` - Optional. The amount of time in milliseconds to advance the virtual clock in each
  iteration.
- `params.httpCallInstructions` - Optional. Array of HTTP call instructions to process during stabilization.
  These instructions define how to handle specific HTTP requests.

:::danger[Throws]

- Error if the fixture cannot be stabilized after maximum attempts
- Error if any HTTP instruction is not invoked during stabilization
- Error if any HTTP request is not handled during stabilization

:::

:::note

* This function is designed to work only within fakeAsync zone.
* When you created a component using the method createComponent of fixture, the fixture is still marked as stable,
  if you don't run any asynchronous tasks within the component constructor or within its dependencies.
  Make sure you set everything up (did overrides to methods, passed values to inputs, etc.), as you need to call the
  runTasksUntilStable function to run the Angular component's life cycle.
  Once you called it, the ngOnInit method will be invoked, and the fixture now is in status unstable.
* This function processes only HTTP requests made using Angular HTTP client.
* To guarantee that your passed HTTP call instructions will be invoked, the function will throw if some of them were not
  invoked during stabilization. This is useful for cases when you initialize your component with some data as the
  initial state, and your test case covers error responses, which preserve the initial state.
* If you didn't process any of the HTTP requests that entered the queue of tasks, the function will throw an error. This
  helps you to cover that piece of code you expect to cover.
* When your code uses setInterval calls, this may cause problems for stabilizing the fixture. You might need to mock the
  place where setInterval is invoked or run the code outside the Angular zone using NgZone.prototype.runOutsideAngular.
  Additionally, you will receive warnings in the console log if setInterval is detected with stack trace pointing you to
  easier find the place where setInterval is invoked.

:::

**Example:**

```typescript
import {runTasksUntilStable} from 'ngx-testbox/testing';
import {fakeAsync} from '@angular/core/testing';

it('should load data after initialization', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyComponent);

    // Run tasks until the fixture is stable
    runTasksUntilStable(fixture);

    // Now you can make assertions
    expect(fixture.componentInstance.data).toBeDefined();
}));

// With HTTP call instructions
it('should handle HTTP requests', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyComponent);

    runTasksUntilStable(fixture, {
        httpCallInstructions: [
            [['api/users', 'GET'], () => new HttpResponse({body: users, status: 200})]
        ]
    });

    // Now you can make assertions
    expect(fixture.componentInstance.users).toEqual(users);
}));
```

## completeHttpCalls

Completes all HTTP calls that are in the queue and processes all subsequent tasks.
This function only handles HTTP requests that were scheduled using the Angular HttpClient.

For each request in the queue, it finds a matching instruction from the provided array
and uses it to generate and flush an appropriate response.

**Example:**

```typescript
import {completeHttpCalls} from 'ngx-testbox/testing';
import {HttpResponse} from '@angular/common/http';

// In a fakeAsync test
completeHttpCalls([
    [['api/users', 'GET'], () => new HttpResponse({body: users, status: 200})]
]);
```

**Parameters:**:

- `httpCallInstructions` - An array of instructions defining how to handle specific HTTP requests
- `options` (optional) - Configuration options
    - `httpTestingController` - The HTTP testing controller instance (defaults to the one from TestBed)

**Throws**:

- Error if matching instruction is not found for a request

## debugElementHarness

A utility class that provides a convenient API for interacting with elements in tests using test IDs.

This class simplifies the process of querying for elements and performing common actions like clicking,
focusing, and getting text content. It works with elements that have a test ID attribute, by default with ID attributes
 that are applied by the TestIdDirective.

**Type Parameters**:

- `TestIds` - A readonly array of string literals representing the test IDs to be used

**Properties**:

- `elements` - A record of element APIs for each test ID, providing access to methods for each element identified by a
  test ID

**Constructor Parameters**:

- `debugElement` - The root debug element to search within
- `testIds` - An array of test IDs to create element APIs for
- `testIdAttribute` - The attribute name used for test IDs (default: 'data-test-id')

**Example:**

```typescript
import {DebugElementHarness} from 'ngx-testbox/testing';

// Define test IDs
const TEST_IDS = ['submitButton', 'cancelButton'] as const;

// Create a harness
const harness = new DebugElementHarness(fixture.debugElement, TEST_IDS);

// Query elements
const submitButton = harness.elements.submitButton.query();

// Interact with elements
harness.elements.submitButton.click();
harness.elements.cancelButton.focus();

// Get text content
const buttonText = harness.elements.submitButton.getTextContent();
```

### Methods

Each element has an interface with easy access to DOM

#### query

Queries for an element with the test ID.

**Parameters:**

- `parentDebugElement` - Optional. Parent debug element to search within

**Returns:** The found debug element `DebugElement`.

#### queryAll

Queries for all elements with the test ID.

**Parameters:**

- `parentDebugElement` - Optional. Parent debug element to search within

**Returns:** An array of found debug elements.

#### click

Clicks the element.

**Parameters:**

- `parentDebugElement` - Optional. Parent debug element to search within

#### focus

Focuses the element.

**Parameters:**

- `parentDebugElement` - Optional. Parent debug element to search within

#### getTextContent

Gets the text content of the element.

**Parameters:**

- `parentDebugElement` - Optional. Parent debug element to search within

**Returns:** The text content of the element.

## passTime

Advances the virtual clock by the specified amount of time and processes all microtasks.

This utility function is useful in Angular tests to simulate the passage of time
for testing asynchronous operations like timeouts, intervals, and promises.

**Parameters:**:

- `time` - The amount of time in milliseconds to advance (defaults to 1000ms)

**Example:**

```typescript
import {passTime} from 'ngx-testbox/testing';
import {fakeAsync} from '@angular/core/testing';

it('should update after timeout', fakeAsync(() => {
    // Setup component
    component.startTimer();

    // Advance time by default 1000ms
    passTime();
    expect(component.timerCompleted).toBeTrue();

    // With custom time
    component.startLongProcess();
    passTime(5000); // Advances time by 5000ms
    expect(component.processCompleted).toBeTrue();
}));
```

## predefinedHttpCallInstructions

A collection of predefined HTTP call instructions for different HTTP methods and status types.

This object provides a convenient way to create HTTP call instructions for testing without
having to manually specify the status codes and response formats. It supports all common
HTTP methods and both success and error responses.

### Methods

**Predefined HTTP Methods**:

- HEAD
- OPTIONS
- GET
- POST
- PUT
- PATCH
- DELETE

**Predefined Status Types**:

- success (returns 200 OK)
- error (returns 500 Internal Server Error)

**Parameters:**

Each method in the object is a function that takes next parameters:
- `path` - EndpointPath
- `responseGetter` - Is the responseGetter. It returns the body of the response.

**Returns:** `HttpCallInstruction` but with one quirk.
The `HttpCallInstruction` takes the value from your provided responseGetter as the response's body.

**Example:**

```typescript
import {predefinedHttpCallInstructions} from 'ngx-testbox/testing';

// Create a GET request with a success response
const getSuccess = predefinedHttpCallInstructions.get.success('api/users');

// Create a POST request with an error response and custom response body
const postError = predefinedHttpCallInstructions.post.error('api/users',
    () => ({error: 'User already exists'}));

// Use with runTasksUntilStable
runTasksUntilStable(fixture, {httpCallInstructions: [getSuccess, postError]});

// Or use with completeHttpCalls
completeHttpCalls([getSuccess, postError]);
```

## TestIdDirective

A unified way of marking your elements on screen with a unique identifier for testing purposes.
This Angular attribute directive defines a consistent approach for adding test identifiers to DOM elements.
It sets the 'data-test-id' attribute on a DOM node, which can then be accessed by any testing
framework such as Cypress, Jasmine, Jest, etc.

**Inputs**

- `testboxTestId` - The value to be assigned to the data-test-id attribute.

**Example:**

```html
<div testboxTestId="user-profile">User Profile</div>
```

Renders as:

```html
<button testboxTestId="submit-button">Submit</button>
<!-- Renders as: <button data-test-id="submit-button">Submit</button> -->
```

### Methods

#### idsToMap

Utility method that converts an array of test IDs into a map where both keys and values are the test IDs.
This is useful for creating a type-safe object of test IDs that can be used in components and tests.

**Type Parameters:**

- `T` - Type parameter extending string for the test IDs

**Parameters:**

- `testIds` - Array of test ID strings (readonly T[])

**Returns:** An object where keys and values are the test IDs

**Example:**

```typescript
const testIds = ['submit-button', 'cancel-button', 'user-name'] as const;
const testIdsMap = TestIdDirective.idsToMap(['submit-button', 'cancel-button', 'user-name']);
// Results in: { 'submit-button': 'submit-button', 'cancel-button': 'cancel-button', 'user-name': 'user-name' }

// Can be used in a component:
@Component({
  template: `<button [testboxTestId]="testIds['submit-button']">Submit</button>`
})
class MyComponent {
  testIds = testIdsMap;
}
```
