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

## Testing CRUD Operations with ngx-testbox

In this tutorial, we'll demonstrate how to use ngx-testbox to test CRUD (Create, Read, Update, Delete) operations in a simple Todo application. We'll cover each operation separately, showing how to set up tests, define HTTP call instructions, and verify component behavior.

### Setting up the Todo Application

Before diving into testing, let's define a simple Todo application structure. Our application will have:

1. A list of todos
2. A form to add new todos
3. Options to edit and delete todos

Here's how we'll define our test IDs:

```typescript
import { TestIdDirective } from 'ngx-testbox';

export const testIds = [
  'todoList',
  'todoItem',
  'todoForm',
  'todoInput',
  'addTodoButton',
  'editTodoButton',
  'deleteTodoButton',
  'todoStatus',
  'errorMessage'
] as const;

export const testIdMap = TestIdDirective.idsToMap(testIds);
```

And here's a simplified component template:

```html
<div [testboxTestId]="testIdMap.todoList">
  <div *ngFor="let todo of todos" [testboxTestId]="testIdMap.todoItem">
    <span>{{ todo.title }}</span>
    <span [testboxTestId]="testIdMap.todoStatus">{{ todo.completed ? 'Completed' : 'Active' }}</span>
    <button [testboxTestId]="testIdMap.editTodoButton" (click)="editTodo(todo)">Edit</button>
    <button [testboxTestId]="testIdMap.deleteTodoButton" (click)="deleteTodo(todo.id)">Delete</button>
  </div>
</div>

<form [testboxTestId]="testIdMap.todoForm" (ngSubmit)="addTodo()">
  <input [testboxTestId]="testIdMap.todoInput" [(ngModel)]="newTodo" name="newTodo" />
  <button [testboxTestId]="testIdMap.addTodoButton" type="submit">Add Todo</button>
</form>

<p *ngIf="errorMessage" [testboxTestId]="testIdMap.errorMessage">{{ errorMessage }}</p>
```

### Create Operation (Adding a Todo)

Let's start by testing the "Create" operation—adding a new todo item.

#### Test Case: Successfully Adding a Todo

```typescript
import {
  predefinedHttpCallInstructions,
  runTasksUntilStable,
  DebugElementHarness
} from 'ngx-testbox/testing';
import { fakeAsync } from '@angular/core/testing';

describe('TodoComponent - Create Operation', () => {
  let fixture: ComponentFixture<TodoComponent>;
  let component: TodoComponent;
  let harness: DebugElementHarness;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TodoComponent],
      imports: [FormsModule, HttpClientModule]
    });

    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    harness = new DebugElementHarness(fixture.debugElement, testIds);
    fixture.detectChanges();
  });

  it('should add a new todo when form is submitted', fakeAsync(() => {
    // Arrange
    const newTodoTitle = 'Buy groceries';
    const newTodoResponse = { id: 1, title: newTodoTitle, completed: false };

    const addTodoSuccess = () =>
      predefinedHttpCallInstructions.post.success(
        'https://api.example.com/todos',
        newTodoResponse
      );

    // Act
    const todoInput = harness.elements.todoInput.query();
    todoInput.nativeElement.value = newTodoTitle;
    todoInput.nativeElement.dispatchEvent(new Event('input'));

    harness.elements.addTodoButton.click();
    runTasksUntilStable(fixture, { httpCallInstructions: [addTodoSuccess] });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
    expect(todoItems[0].nativeElement.textContent).toContain(newTodoTitle);
  }));

  it('should display error message when adding todo fails', fakeAsync(() => {
    // Arrange
    const newTodoTitle = 'Buy groceries';

    const addTodoError = () =>
      predefinedHttpCallInstructions.post.error(
        'https://api.example.com/todos',
        { message: 'Failed to add todo' }
      );

    // Act
    const todoInput = harness.elements.todoInput.query();
    todoInput.nativeElement.value = newTodoTitle;
    todoInput.nativeElement.dispatchEvent(new Event('input'));

    harness.elements.addTodoButton.click();
    runTasksUntilStable(fixture, { httpCallInstructions: [addTodoError] });

    // Assert
    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).toBeDefined();
    expect(errorMessage.nativeElement.textContent).toContain('Failed to add todo');
  }));
});
```

### Read Operation (Fetching Todos)

Next, let's test the "Read" operation - fetching and displaying todos.

#### Test Case: Successfully Loading Todos

```typescript
describe('TodoComponent - Read Operation', () => {
  let fixture: ComponentFixture<TodoComponent>;
  let component: TodoComponent;
  let harness: DebugElementHarness;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TodoComponent],
      imports: [FormsModule, HttpClientModule]
    });

    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should load and display todos on initialization', fakeAsync(() => {
    // Arrange
    const mockTodos = [
      { id: 1, title: 'Learn Angular', completed: true },
      { id: 2, title: 'Build an app', completed: false }
    ];

    const getTodosSuccess = () =>
      predefinedHttpCallInstructions.get.success(
        'https://api.example.com/todos',
        mockTodos
      );

    // Act
    runTasksUntilStable(fixture, { httpCallInstructions: [getTodosSuccess] });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();

    expect(todoItems.length).toBe(2);
    expect(todoItems[0].nativeElement.textContent).toContain('Learn Angular');
    expect(todoItems[0].nativeElement.textContent).toContain('Completed');
    expect(todoItems[1].nativeElement.textContent).toContain('Build an app');
    expect(todoItems[1].nativeElement.textContent).toContain('Active');
  }));

  it('should display error message when loading todos fails', fakeAsync(() => {
    // Arrange
    const getTodosError = () =>
      predefinedHttpCallInstructions.get.error(
        'https://api.example.com/todos',
        { message: 'Failed to load todos' }
      );

    // Act
    runTasksUntilStable(fixture, { httpCallInstructions: [getTodosError] });

    // Assert
    const errorMessage = harness.elements.errorMessage.query();

    expect(errorMessage).toBeDefined();
    expect(errorMessage.nativeElement.textContent).toContain('Failed to load todos');
  }));
});
```

### Update Operation (Editing a Todo)

Now, let's test the "Update" operation - editing an existing todo.

#### Test Case: Successfully Updating a Todo

```typescript
describe('TodoComponent - Update Operation', () => {
  let fixture: ComponentFixture<TodoComponent>;
  let component: TodoComponent;
  let harness: DebugElementHarness;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TodoComponent],
      imports: [FormsModule, HttpClientModule]
    });

    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should update a todo when edit button is clicked', fakeAsync(() => {
    // Arrange
    const mockTodos = [
      { id: 1, title: 'Learn Angular', completed: false }
    ];

    const getTodosSuccess = () =>
      predefinedHttpCallInstructions.get.success(
        'https://api.example.com/todos',
        mockTodos
      );

    const updatedTodo = { id: 1, title: 'Learn Angular Thoroughly', completed: true };

    const updateTodoSuccess = () =>
      predefinedHttpCallInstructions.put.success(
        'https://api.example.com/todos/1',
        updatedTodo
      );

    // Act - First load the todos
    runTasksUntilStable(fixture, { httpCallInstructions: [getTodosSuccess] });

    // Then edit the todo
    harness.elements.editTodoButton.click();

    // Simulate editing in a dialog or inline form
    component.editingTodo = { ...mockTodos[0] };
    component.editingTodo.title = 'Learn Angular Thoroughly';
    component.editingTodo.completed = true;
    component.saveEditedTodo();

    runTasksUntilStable(fixture, { httpCallInstructions: [updateTodoSuccess] });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
    expect(todoItems[0].nativeElement.textContent).toContain('Learn Angular Thoroughly');
    expect(todoItems[0].nativeElement.textContent).toContain('Completed');
  }));

  it('should display error message when updating todo fails', fakeAsync(() => {
    // Arrange
    const mockTodos = [
      { id: 1, title: 'Learn Angular', completed: false }
    ];

    const getTodosSuccess = () =>
      predefinedHttpCallInstructions.get.success(
        'https://api.example.com/todos',
        mockTodos
      );

    const updateTodoError = () =>
      predefinedHttpCallInstructions.put.error(
        'https://api.example.com/todos/1',
        { message: 'Failed to update todo' }
      );

    // Act - First load the todos
    runTasksUntilStable(fixture, { httpCallInstructions: [getTodosSuccess] });

    // Then try to edit the todo
    harness.elements.editTodoButton.click();

    // Simulate editing in a dialog or inline form
    component.editingTodo = { ...mockTodos[0] };
    component.editingTodo.title = 'Learn Angular Thoroughly';
    component.saveEditedTodo();

    runTasksUntilStable(fixture, { httpCallInstructions: [updateTodoError] });

    // Assert
    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).toBeDefined();
    expect(errorMessage.nativeElement.textContent).toContain('Failed to update todo');
  }));
});
```

### Delete Operation (Removing a Todo)

Finally, let's test the "Delete" operation - removing a todo from the list.

#### Test Case: Successfully Deleting a Todo

```typescript
describe('TodoComponent - Delete Operation', () => {
  let fixture: ComponentFixture<TodoComponent>;
  let component: TodoComponent;
  let harness: DebugElementHarness;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TodoComponent],
      imports: [FormsModule, HttpClientModule]
    });

    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should delete a todo when delete button is clicked', fakeAsync(() => {
    // Arrange
    const mockTodos = [
      { id: 1, title: 'Learn Angular', completed: false },
      { id: 2, title: 'Build an app', completed: false }
    ];

    const getTodosSuccess = () =>
      predefinedHttpCallInstructions.get.success(
        'https://api.example.com/todos',
        mockTodos
      );

    const deleteTodoSuccess = () =>
      predefinedHttpCallInstructions.delete.success(
        'https://api.example.com/todos/1'
      );

    // Act - First load the todos
    runTasksUntilStable(fixture, { httpCallInstructions: [getTodosSuccess] });

    // Then delete the first todo
    const deleteButtons = harness.elements.deleteTodoButton.queryAll();
    deleteButtons[0].nativeElement.click();

    runTasksUntilStable(fixture, { httpCallInstructions: [deleteTodoSuccess] });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
    expect(todoItems[0].nativeElement.textContent).toContain('Build an app');
  }));

  it('should display error message when deleting todo fails', fakeAsync(() => {
    // Arrange
    const mockTodos = [
      { id: 1, title: 'Learn Angular', completed: false }
    ];

    const getTodosSuccess = () =>
      predefinedHttpCallInstructions.get.success(
        'https://api.example.com/todos',
        mockTodos
      );

    const deleteTodoError = () =>
      predefinedHttpCallInstructions.delete.error(
        'https://api.example.com/todos/1',
        { message: 'Failed to delete todo' }
      );

    // Act - First load the todos
    runTasksUntilStable(fixture, { httpCallInstructions: [getTodosSuccess] });

    // Then try to delete the todo
    harness.elements.deleteTodoButton.click();

    runTasksUntilStable(fixture, { httpCallInstructions: [deleteTodoError] });

    // Assert
    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).toBeDefined();
    expect(errorMessage.nativeElement.textContent).toContain('Failed to delete todo');

    // The todo should still be in the list
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
  }));
});
```

## More cases

### Smart components

It is very likely that your application contains smart components too which are aware of their own state, their purpose is to manage the state.
A widespread case when creating such a component, further logic should fetch its state from the server side at initial steps.

```typescript

@Component({
    template: '<div *ngFor="let post of posts">{{post.message}}</div>',
})
export class MyComponent {
    posts = signal();

    ngOnInit() {
        this.http.get('https://DOMAIN/api/getPosts')
            .pipe(takeUntilDestroyed(this.destroyRef)) // <-- Never forgot to unsubscribe
            .subscribe((posts) => {
                this.posts.set(posts);
            })
    }
}

describe('MyComponent', () => {

})
```

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
