---
sidebar_position: 1
---

# Component testing

## Prerequisites

Integration testing has one big advantage over unit tests—integration ones may cover entire features.
On the other hand, despite e2e tests, they are more reliable but are cumbersome and require additional effort to set them up.
The black-box integration testing shows awesome results.
It is straightforward to set up.
It doesn't require additional effort for installing on CI/CD pipelines.
It keeps the code base maintainable and well-shaped.

Prerequisites for setting black-box integration tests up:
1. You need to know your approximate REST API contract with your server.
2. You need to know the main elements on the page to set tests against them.
3. Install ngx-testbox.

## Cook book

Receipt of good test cases includes the next steps:
1. Delve into your business domain. Investigate **Acceptance Criteria** of your user story, at least approximately.
Each Acceptance Criteria is a test case, or several ones, that you will cover in code base.
2. Set test ids up. If you have written template, apply them to elements.
3. Make skeletons off of your test cases—write test suites (`describe`s) + test cases (`it`s).
4. Generate the `Harness` class for your component that extends from `DebugElementHarness`.
5. Implement one by one a test case using the [runTasksUntilStable](#runTasksUntilStable) function.
6. In parallel, you need to prepare http call instructions (`HttpCallInstruction`).
For that you need to communicate with your backend team to understand the API contract.

`HttpCallInstruction` is a guideline for a corresponding HTTP request, how it should be resolved.
It describes what http status code, body and headers to respond with.
You may use predefined http call instructions (`predefinedHttpCallInstructions`), which serve as shortcuts for common cases.
`predefinedHttpCallInstructions` contains following REST methods `head, options, get, post, put, patch, delete` in two statuses `success` (200) or `error` (500).
Additionally, you can provide the body with such an instruction to return in the response.
For complex use cases see the [Custom responses](#custom-responses) block.

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

`DebugElementHarness` is a convenient way to interact with your elements.
It gives you basic functionality in a declarative way to query, query all, click, focus and get text content.

```typescript
import {DebugElementHarness} from 'ngx-testbox/testing';

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

export class TodosHarness extends DebugElementHarness<typeof testIds> {
    constructor(debugElement: DebugElement) {
        super(debugElement, testIds);
    }
}

const harness = new TodosHarness(fixture.debugElement);

// A user adds a todo but later decides to not do it. This is an abstract example, your test implementation will be different.
harness.todoInput.query().value = 'Read a book'
harness.addTodoButton.click(); // <-- Adds a new item
const todoItem = harness.todoItem.queryAll()
    .find(todoItemDebugElement => harness.todoTitle.getTextContent(todoItemDebugElement) === 'Read a book'); // <-- Finds the debugElement of the recently added item
harness.deleteTodoButton.click(todoItem) // <-- Deletes the item
```

#### Example with applying test ids

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

### Writing tests

It's time to write tests.
Collect **Acceptance Criteria** and split them into test cases.

The core functionality is hidden behind the `runTasksUntilStable` function.
This is a loop of iterations over appearing asynchronous tasks to resolve them, while your component lifetime. 
All tests are running within the fakeAsync zone, it gives us ultimate control over time passage, so we can test components step by step.
The biggest advantage of using `runTasksUntilStable` is in that it takes full control over all technical aspects,
so you need to focus on what matters for your features.

The things are: 
1. Runs change detection.
2. Responds to HTTP requests.
3. Pushes time forward. Executes until all asynchronous operations are resolved so that the fixture becomes stable.

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

        // Assert
        expect(component.todos()).toEqual(mockTodos);

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

        // Assert
        expect(component.errorMessage).toBe('Failed to load todos');

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
        
        // This is where you may need your custom http call instruction, to make the filtration manually
        const getTodos: HttpCallInstruction = [['https://DOMAIN/api/todos', 'GET'], (_httpRequest, urlSearchParams) => {
            const searchString = urlSearchParams.get('title');
            const body = allTodos.filter(({title}) => title.includes(searchString))
            
            return new HttpResponse({ body: mockBody, status: 200 })
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
    const newTodoResponse = { id: 1, title: 'Buy groceries', completed: false };

    const addTodoSuccess = () =>
      predefinedHttpCallInstructions.post.success(
        'https://DOMAIN/api/todos',
        newTodoResponse
      );

    // Act - Fill the form and submit
    const todoInput = harness.elements.todoInput.query();
    todoInput.nativeElement.value = 'Buy groceries';
    todoInput.nativeElement.dispatchEvent(new Event('input'));

    harness.elements.addTodoButton.click();

    // Handle the HTTP request triggered by addTodo()
    runTasksUntilStable(fixture, { httpCallInstructions: [addTodoSuccess] });

    // Assert
    expect(component.todos.length).toBe(1);
    expect(component.todos[0].title).toBe('Buy groceries');
    expect(component.newTodo).toBe(''); // Input should be cleared

    // Verify the UI reflects the new todo
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy groceries');
  }));

  it('should show validation error for empty todo', fakeAsync(() => {
    // Act - Submit form with empty input
    harness.elements.addTodoButton.click();

    // No HTTP request should be made, just run tasks to stabilize
    runTasksUntilStable(fixture);

    // Assert
    expect(component.errorMessage).toBe('Todo cannot be empty');

    // Verify the UI shows the error message
    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).toBeDefined();
    expect(errorMessage.nativeElement.textContent).toContain('Todo cannot be empty');
  }));

  it('should show error message when adding todo fails', fakeAsync(() => {
    // Arrange
    const addTodoError = () =>
      predefinedHttpCallInstructions.post.error(
        'https://DOMAIN/api/todos',
        { message: 'Failed to add todo' }
      );

    // Act - Fill the form and submit
    const todoInput = harness.elements.todoInput.query();
    todoInput.nativeElement.value = 'Buy groceries';
    todoInput.nativeElement.dispatchEvent(new Event('input'));

    harness.elements.addTodoButton.click();

    // Handle the HTTP request with an error
    runTasksUntilStable(fixture, { httpCallInstructions: [addTodoError] });

    // Assert
    expect(component.errorMessage).toBe('Failed to add todo');

    // Verify the UI shows the error message
    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).toBeDefined();
    expect(errorMessage.nativeElement.textContent).toContain('Failed to add todo');
  }));
});
```

### Example 4: Testing Deleting a Todo

This example shows how to test deleting a todo:

```typescript
describe('TodosComponent Deleting Todos', () => {
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

        // Initialize with some todos
        component.todos = [
            {id: 1, title: 'Learn Angular', completed: false},
            {id: 2, title: 'Build an app', completed: true}
        ];
    });

    it('should delete a todo when delete button is clicked', fakeAsync(() => {
        // Arrange
        const deleteTodoSuccess = () =>
            predefinedHttpCallInstructions.delete.success(
                'https://DOMAIN/api/todos/1'
            );

        // Act - First render the component with the initial todos
        fixture.detectChanges();

        // Verify initial state
        let todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(2);

        // Click delete button on the first todo
        const deleteButtons = harness.elements.deleteTodoButton.queryAll();
        deleteButtons[0].nativeElement.click();

        // Handle the HTTP request triggered by deleteTodo()
        runTasksUntilStable(fixture, {httpCallInstructions: [deleteTodoSuccess]});

        // Assert
        expect(component.todos.length).toBe(1);
        expect(component.todos[0].title).toBe('Build an app');

        // Verify the UI reflects the deletion
        todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(1);
        expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Build an app');
    }));

    it('should show error message when deleting todo fails', fakeAsync(() => {
        // Arrange
        const deleteTodoError = () =>
            predefinedHttpCallInstructions.delete.error(
                'https://DOMAIN/api/todos/1',
                {message: 'Failed to delete todo'}
            );

        // Act - First render the component with the initial todos
        fixture.detectChanges();

        // Click delete button on the first todo
        const deleteButtons = harness.elements.deleteTodoButton.queryAll();
        deleteButtons[0].nativeElement.click();

        // Handle the HTTP request with an error
        runTasksUntilStable(fixture, {httpCallInstructions: [deleteTodoError]});

        // Assert
        expect(component.errorMessage).toBe('Failed to delete todo');
        expect(component.todos.length).toBe(2); // Todo should not be removed

        // Verify the UI shows the error message
        const errorMessage = harness.elements.errorMessage.query();
        expect(errorMessage).toBeDefined();
        expect(errorMessage.nativeElement.textContent).toContain('Failed to delete todo');
    }));
});
```

These examples demonstrate how to use `runTasksUntilStable` to test various aspects of the Todo component, including initialization, filtering, adding, and deleting todos. Each example follows the Arrange-Act-Assert pattern and shows how to handle both success and error scenarios.

## Custom responses

Sometimes you need to return different responses based on the request payload or URL parameters. Ngx-testbox provides a flexible way to define custom responses for your HTTP requests, allowing you to simulate various server behaviors in your tests.

### Basic Custom Response

You can create custom responses by defining a function that evaluates the request and returns an appropriate response:

```typescript
describe('TodoComponent - Custom Responses', () => {
    it('should handle custom responses based on request payload', fakeAsync(() => {
        // Arrange
        const customResponseHandler = (request) => {
            // Check the request body
            const requestBody = JSON.parse(request.body);

            if (requestBody.priority === 'high') {
                // Return a specific response for high priority todos
                return {
                    id: 999,
                    title: requestBody.title,
                    completed: false,
                    priority: 'high',
                    dueDate: '2023-12-31'
                }
            } else {
                // Return a standard response for normal todos
                return {
                    status: 200,
                    body: {
                        id: 1000,
                        title: requestBody.title,
                        completed: false
                    }
                };
            }
        };

        const addTodoCustomResponse = () =>
            predefinedHttpCallInstructions.post.custom(
                'https://api.example.com/todos',
                customResponseHandler
            );

        // Act - Add a high priority todo
        const todoInput = harness.elements.todoInput.query();
        todoInput.nativeElement.value = 'Urgent task';
        todoInput.nativeElement.dispatchEvent(new Event('input'));

        // Set priority in the component (assuming there's a priority selector)
        component.newTodoPriority = 'high';

        harness.elements.addTodoButton.click();
        runTasksUntilStable(fixture, {httpCallInstructions: [addTodoCustomResponse]});

        // Assert
        const todoItems = harness.elements.todoItem.queryAll();
        expect(todoItems.length).toBe(1);
        expect(todoItems[0].nativeElement.textContent).toContain('Urgent task');
        expect(todoItems[0].nativeElement.textContent).toContain('high');
    }));
});
```

### URL Parameter Based Responses

You can also create responses based on URL parameters or path segments:

```typescript
it('should handle custom responses based on URL parameters', fakeAsync(() => {
  // Arrange
  const customResponseHandler = (request) => {
    // Extract todo ID from URL
    const urlParts = request.url.split('/');
    const todoId = urlParts[urlParts.length - 1];

    if (todoId === '1') {
      return {
        status: 200,
        body: { 
          id: 1,
          title: 'First todo',
          completed: true
        }
      };
    } else if (todoId === '2') {
      return {
        status: 200,
        body: { 
          id: 2,
          title: 'Second todo',
          completed: false
        }
      };
    } else {
      return {
        status: 404,
        body: { 
          message: 'Todo not found'
        }
      };
    }
  };

  const getTodoCustomResponse = () =>
    predefinedHttpCallInstructions.get.custom(
      'https://api.example.com/todos/1',
      customResponseHandler
    );

  // Act
  runTasksUntilStable(fixture, { httpCallInstructions: [getTodoCustomResponse] });

  // Assert
  const todoDetail = harness.elements.todoDetail.query();
  expect(todoDetail.nativeElement.textContent).toContain('First todo');
  expect(todoDetail.nativeElement.textContent).toContain('Completed');
}));
```

### Simulating Network Conditions

Custom responses can also be used to simulate different network conditions:

```typescript
it('should handle slow network responses', fakeAsync(() => {
  // Arrange
  const slowNetworkResponse = (request) => {
    // Simulate a delay of 2 seconds
    tick(2000);

    return {
      status: 200,
      body: [
        { id: 1, title: 'Learn Angular', completed: false },
        { id: 2, title: 'Master ngx-testbox', completed: false }
      ]
    };
  };

  const getTodosSlowResponse = () =>
    predefinedHttpCallInstructions.get.custom(
      'https://api.example.com/todos',
      slowNetworkResponse
    );

  // Act
  // First check that loading indicator is shown
  runTasksUntilStable(fixture, { runUntilStableOptions: { ignoreHttpRequests: true } });

  const loadingIndicator = harness.elements.loadingIndicator.query();
  expect(loadingIndicator).toBeDefined();

  // Then complete the request
  runTasksUntilStable(fixture, { httpCallInstructions: [getTodosSlowResponse] });

  // Assert
  const todoItems = harness.elements.todoItem.queryAll();
  expect(todoItems.length).toBe(2);

  // Loading indicator should be gone
  const loadingIndicatorAfter = harness.elements.loadingIndicator.query();
  expect(loadingIndicatorAfter).toBeUndefined();
}));
```

### Handling Multiple Requests

You can also handle sequences of requests with different custom responses:

```typescript
it('should handle a sequence of requests with pagination', fakeAsync(() => {
  // Arrange
  const page1Response = (request) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');

    if (page === '1') {
      return {
        status: 200,
        body: {
          items: [
            { id: 1, title: 'First todo', completed: false },
            { id: 2, title: 'Second todo', completed: true }
          ],
          pagination: {
            currentPage: 1,
            totalPages: 2,
            hasMore: true
          }
        }
      };
    }
  };

  const page2Response = (request) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');

    if (page === '2') {
      return {
        status: 200,
        body: {
          items: [
            { id: 3, title: 'Third todo', completed: false }
          ],
          pagination: {
            currentPage: 2,
            totalPages: 2,
            hasMore: false
          }
        }
      };
    }
  };

  const getPage1 = () =>
    predefinedHttpCallInstructions.get.custom(
      'https://api.example.com/todos?page=1',
      page1Response
    );

  const getPage2 = () =>
    predefinedHttpCallInstructions.get.custom(
      'https://api.example.com/todos?page=2',
      page2Response
    );

  // Act - Load first page
  runTasksUntilStable(fixture, { httpCallInstructions: [getPage1] });

  // Assert first page
  let todoItems = harness.elements.todoItem.queryAll();
  expect(todoItems.length).toBe(2);

  // Act - Load next page
  harness.elements.nextPageButton.click();
  runTasksUntilStable(fixture, { httpCallInstructions: [getPage2] });

  // Assert both pages loaded
  todoItems = harness.elements.todoItem.queryAll();
  expect(todoItems.length).toBe(3);
}));
```

Custom responses give you the flexibility to test complex scenarios and edge cases in your application, ensuring that your components handle various server responses correctly.
