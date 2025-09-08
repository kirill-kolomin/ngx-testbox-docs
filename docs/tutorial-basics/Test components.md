---
sidebar_position: 1
---

# Component testing

## Prerequisites

Integration tests have a big advantage over unit tests: they can cover entire features.
Compared to end-to-end (E2E) tests, E2E tests are more reliable, but they are also heavier and require more setup.
The black-box integration testing shows awesome results.
It is straightforward to set up.
It doesn't require additional effort for installing on CI/CD pipelines.
It keeps the codebase maintainable and well-shaped.

Prerequisites for setting black-box integration tests up:
1. You need to know your approximate REST API contract with your server.
2. You need to know the main elements on the page to set tests against them.
3. Install ngx-testbox.

## Cook book

Recipe for good test cases includes the next steps:
1. Delve into your business domain. Investigate **Acceptance Criteria** of your user story, at least approximately.
Each Acceptance Criteria is a test case, or several ones, that you will cover in codebase.
2. Set test ids up. If you have written template, apply them to elements.
3. Create skeletons for your test cases—write test suites (`describe`s) + test cases (`it`s).
4. Generate the `Harness` class for your component that extends from `DebugElementHarness`.
5. Implement one by one a test case using the [runTasksUntilStable](#runTasksUntilStable) function.
6. In parallel, you need to prepare HTTP call instructions (`HttpCallInstruction`).
For that you need to communicate with your backend team to understand the API contract.

### Test Ids

One of the main benefits ngx-testbox brings is the simplicity of working with DOM elements.
Define a type array with strings using `as const`, generate a map out of it.
Use the map within template with `TestIdDirective`, and paste the array as an argument to `DebugElementHarness`.
Though you have declarative typed API for access to elements from `DebugElementHarness`.
`TestIdDirective` is an attribute directive that adds attribute `data-test-id` with the value provided as an argument.

:::note

`TestIdDirective` and `DebugElementHarness` work in conjunction, but this is not necessary to use them at all.
They are optional for this black-box integration testing approach.
They are just util functionality.

:::

:::info

You can avoid usage of `TestIdDirective`, if you have your own directive to work with test attributes.
If you wish to continue working with `DebugElementHarness`, you need to pass your existing tests' attribute name as an argument to `DebugElementHarness`. 

:::

#### DebugElementHarness

`DebugElementHarness` is a convenient way to interact with your elements.
Basically, this is a class that you can use as is, or create a wrapper sharpen for specific needs of your component that extends from that class.
It gives you basic functionality in a declarative way to query, query all, click, focus and get text content.

#### Use case example

```typescript
import {TestIdDirective} from 'ngx-testbox';

export const testIds = [
    'todoList',
    'todoItem',
    'todoForm',
    'todoInput',
    'addTodoButton',
    'editTodoButton',
    'deleteTodoButton',
    'todoTitle',
    'todoStatus',
    'errorMessage'
] as const;

export const testIdMap = TestIdDirective.idsToMap(testIds);
```

```typescript
import {testIdMap} from './test-ids';
import {TestIdDirective} from 'ngx-testbox';

@Component({
    imports: [TestIdDirective]
})
class TodosComponent {
    testIds = testIdMap;
}
```

```html
<div [testboxTestId]="testIds.todoList">
  <div *ngFor="let todo of todos" [testboxTestId]="testIds.todoItem">
    <span [testboxTestId]="testIds.todoTitle">{{ todo.title }}</span>
    <span [testboxTestId]="testIds.todoStatus">{{ todo.completed ? 'Completed' : 'Active' }}</span>
    <button [testboxTestId]="testIds.editTodoButton" (click)="editTodo(todo)">Edit</button>
    <button [testboxTestId]="testIds.deleteTodoButton" (click)="deleteTodo(todo.id)">Delete</button>
  </div>
</div>

<form [testboxTestId]="testIds.todoForm" (ngSubmit)="addTodo()">
  <input [testboxTestId]="testIds.todoInput" [(ngModel)]="newTodo" name="newTodo" />
  <button [testboxTestId]="testIds.addTodoButton" type="submit">Add Todo</button>
</form>

<p *ngIf="errorMessage" [testboxTestId]="testIds.errorMessage">{{ errorMessage }}</p>
```

```typescript
import {DebugElementHarness} from 'ngx-testbox/testing';

const harness = new DebugElementHarness(fixture.debugElement, testIds);

// A user adds a todo but later decides to not do it. This is an abstract example, your test implementation will be different.
harness.todoInput.query().value = 'Read a book'
harness.addTodoButton.click(); // <-- Adds a new item
const todoItem = harness.todoItem.queryAll()
    .find(todoItemDebugElement => harness.todoTitle.getTextContent(todoItemDebugElement) === 'Read a book'); // <-- Finds the debugElement of the recently added item
harness.deleteTodoButton.click(todoItem) // <-- Deletes the item
```

### Handling HTTP requests

`HttpCallInstruction` is a guideline for a corresponding HTTP request, how it should be resolved.
It describes what HTTP status code, body and headers to respond with.
You may use predefined HTTP call instructions (`predefinedHttpCallInstructions`), which serve as shortcuts for common cases.
`predefinedHttpCallInstructions` contains following REST methods `head, options, get, post, put, patch, delete` in two statuses `success` (200) or `error` (500).
Additionally, you can provide the body with such an instruction to return in the response.

```typescript
import {predefinedHttpCallInstructions} from 'ngx-testbox/testing';

// Means that response on this request to delete the todo with id 2221 will fail.
predefinedHttpCallInstructions.delete.error('https://DOMAIN/todos/2221')
// Means that response on this request to get the todo with id 1123 will success with defined body.
predefinedHttpCallInstructions.get.success('https://DOMAIN/todos/1123', () => ({
    title: 'Buy fruits for tomorrow',
    completed: 'true',
}))
```

:::tip[Custom HTTP call instructions]

For more complex cases you can define your custom HTTP instructions.
Basically, `HttpCallInstruction` is an interface that you can refer to, when define something specific.

:::

### Writing tests

It's time to write tests.
Collect **Acceptance Criteria** and split them into test cases.

The core functionality is hidden behind the `runTasksUntilStable` function.
It continuously resolves asynchronous tasks that appear during your component’s lifecycle.
All tests are running within the fakeAsync zone, it gives us ultimate control over time passage, so we can test components step by step.
The biggest advantage of using `runTasksUntilStable` is in that it takes full control over all technical aspects,
so you need to focus on what matters for your features. The things are:
1. Runs change detection.
2. Responds to HTTP requests.
3. Pushes time forward. Executes until all asynchronous operations are resolved so that the fixture becomes stable.
4. Runs the cycle again.

I recommend testing your components with black-box style only.
It means that you test UI behaviour based on provided inputs.

:::tip[Test internal state]

You can combine both approaches black and white box testing in components if you wish.
But be careful; the more your tests know about codebase internals, the harder it is to maintain such tests.

:::

:::tip[Unit testing]

Unit tests ideally serve for white-box testing.
It's a good approach to test internal state.
But you don't need to use ngx-testbox for it.

:::

:::danger

If you need to test a specific method result, don't test the method was ever called, instead try to test effects the method made.
Otherwise, you increase both tests and codebase structure coupling, which leads to harder project's maintenance.

:::

### Example 1: Testing Component Initialization

This example demonstrates how to test the component's initialization process, which includes an HTTP request to fetch todos:

```typescript
import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {DebugElementHarness, predefinedHttpCallInstructions, runTasksUntilStable} from 'ngx-testbox/testing';
import {TodosComponent} from './todos.component';
import {FormsModule} from '@angular/forms';

describe('TodosComponent Initialization', () => {
    let fixture: ComponentFixture<TodosComponent>;
    let component: TodosComponent;
    let harness: DebugElementHarness<typeof testIds>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TodosComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        fixture = TestBed.createComponent(TodosComponent);
        component = fixture.componentInstance;
        harness = new DebugElementHarness(fixture.debugElement, testIds);
    });

    it('should load todos on initialization', fakeAsync(() => {
        // Arrange
        const mockTodos = [
            {id: 1, title: 'Buy fruits', completed: false},
            {id: 2, title: 'Watch baseball', completed: true}
        ];

        const getTodosSuccess = () =>
            predefinedHttpCallInstructions.get.success(
                'https://DOMAIN/api/todos',
                mockTodos
            );

        // Act
        // This will trigger ngOnInit and handle the HTTP request
        runTasksUntilStable(fixture, {httpCallInstructions: [getTodosSuccess]});

        // Verify the UI reflects the loaded data
        const todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(2);
        expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy fruits');
        expect(harness.elements.todoStatus.getTextContent(todoItems[0])).toContain('Active');
        expect(harness.elements.todoTitle.getTextContent(todoItems[1])).toContain('Watch baseball');
        expect(harness.elements.todoStatus.getTextContent(todoItems[1])).toContain('Completed');
    }));

    it('should show error message when loading todos fails', fakeAsync(() => {
        // Arrange
        const getTodosError = () =>
            predefinedHttpCallInstructions.get.error(
                'https://DOMAIN/api/todos',
                {message: 'Failed to load todos'}
            );

        // Act
        runTasksUntilStable(fixture, {httpCallInstructions: [getTodosError]});

        // Verify the UI shows the error message
        const errorMessage = harness.elements.errorMessage.query();
        expect(errorMessage).toBeDefined();
        expect(errorMessage.nativeElement.textContent).toContain('Failed to load todos');
    }));
});
```

### Example 2: Testing Todo Filtering

This example shows how to test the filtering functionality using the filter input:

```typescript
import {HttpCallInstruction} from 'ngx-testbox/testing';

describe('TodosComponent Filtering', () => {
    let fixture: ComponentFixture<TodosComponent>;
    let component: TodosComponent;
    let harness: DebugElementHarness<typeof testIds>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TodosComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        fixture = TestBed.createComponent(TodosComponent);
        component = fixture.componentInstance;
        harness = new DebugElementHarness(fixture.debugElement, testIds);
    });

    it('should filter todos when filter input changes', fakeAsync(() => {
        // Arrange - First load all todos
        const allTodos = [
            {id: 1, title: 'Learn Angular', completed: false},
            {id: 2, title: 'Build an app', completed: true},
            {id: 3, title: 'Deploy Angular app', completed: false}
        ];

        // This is where you may need your custom HTTP call instruction, to make the filtration manually
        const getTodos: HttpCallInstruction = [['https://DOMAIN/api/todos', 'GET'], (_httpRequest, urlSearchParams) => {
            const searchString = urlSearchParams.get('title');
            const filteredTodos = allTodos.filter(({title}) => title.includes(searchString))

            return new HttpResponse({ body: filteredTodos, status: 200 })
        }]

        // Load initial todos
        runTasksUntilStable(fixture, {httpCallInstructions: [getTodos]});

        // Verify initial state
        let todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(3);

        // Act - Change the filter input
        const filterInput = harness.filterInput.query.nativeElement;
        filterInput.value = 'Angular';
        filterInput.dispatchEvent(new Event('input'));
        filterInput.dispatchEvent(new Event('change'));

        // Handle the HTTP request triggered by input change
        runTasksUntilStable(fixture, {httpCallInstructions: [getTodos]});

        // Assert
        todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(2);
        expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Learn Angular');
        expect(harness.elements.todoTitle.getTextContent(todoItems[1])).toContain('Deploy Angular app');
    }));
});
```

### Example 3: Testing Adding a Todo

This example demonstrates how to test adding a new todo:

```typescript
describe('TodosComponent Adding Todos', () => {
    let fixture: ComponentFixture<TodosComponent>;
    let component: TodosComponent;
    let harness: DebugElementHarness<typeof testIds>;
    // Using custom HTTP call instruction for validation
    const addTodo: HttpCallInstruction = [['https://DOMAIN/api/todos', 'PUT'], (httpRequest) => {
        // Parse the request body to validate it
        const requestBody = JSON.parse(httpRequest.body);

        // Validate that the title is a not empty string
        if (!requestBody?.title || requestBody.title === '') {
            return new HttpResponse({
                status: 400,
                body: { message: 'Todo cannot be empty' }
            });
        }

        // Return success response with the new todo
        return new HttpResponse({
            status: 200,
            body: {
                id: 1, // in real life the id is dynamic
                title: requestBody.title,
                completed: false
            }
        });
    }];

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TodosComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        fixture = TestBed.createComponent(TodosComponent);
        component = fixture.componentInstance;
        harness = new DebugElementHarness(fixture.debugElement, testIds);

        // Initialize with empty todos
        component.todos = [];
    });

    it('should add a new todo when form is submitted', fakeAsync(() => {
        // Arrange
        // Act - Fill the form and submit
        const todoInput = harness.elements.todoInput.query();
        todoInput.nativeElement.value = 'Buy groceries';
        todoInput.nativeElement.dispatchEvent(new Event('input'));

        harness.elements.addTodoButton.click();

        // Handle the HTTP request triggered by form submit
        runTasksUntilStable(fixture, {httpCallInstructions: [addTodo]});

        // Assert
        expect(component.todos.length).toBe(1);
        expect(component.todos[0].title).toBe('Buy groceries');

        // Verify the UI reflects the new todo
        const todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(1);
        expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy groceries');
    }));

    it('should show validation error for empty todo', fakeAsync(() => {
        // Act - Submit form with empty input
        harness.elements.addTodoButton.click();

        runTasksUntilStable(fixture);

        // Assert
        expect(component.errorMessage).toBe('Todo cannot be empty');

        // Verify the UI shows the error message
        const errorMessage = harness.elements.errorMessage.query();
        expect(errorMessage).toBeDefined();
        expect(errorMessage.nativeElement.textContent).toContain('Todo cannot be empty');
    }));
});
```
