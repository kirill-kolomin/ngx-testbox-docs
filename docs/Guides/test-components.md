---
sidebar_position: 1
---

# Component testing guide

This guide demonstrates black-box integration testing patterns using **both** the async/await and fakeAsync approaches.

## Prerequisites

Integration tests have a big advantage over unit tests: they can cover entire features.
Compared to end-to-end (E2E) tests, integration tests are more reliable, maintainable, and faster to run.
The black-box integration testing shows awesome results.

Prerequisites for setting black-box integration tests up:

1. You need to know your approximate REST API contract with your server.
2. You need to know the main elements on the page to set tests against them.
3. Install ngx-testbox.

## Cookbook

Recipe for good test cases includes the next steps:

1. Delve into your business domain. Investigate **Acceptance Criteria** of your user story, at least approximately. Each Acceptance Criteria is a test case, or several ones, that you will cover in codebase.
2. Set test ids up. If you have written template, apply them to elements.
3. Create skeletons for your test cases—write test suites (`describe`s) + test cases (`it`s).
4. Generate the `Harness` class for your component that extends from [`DebugElementHarness`](../api/debug-element-harness.md).
5. Implement one by one a test case using the stabilization function for your chosen approach.
6. In parallel, you need to prepare HTTP call instructions ([`HttpCallInstruction`](../api/http-call-instruction.md)). For that you need to communicate with your backend team to understand the API contract.

---

## Test IDs

One of the main benefits ngx-testbox brings is the simplicity of working with DOM elements.

Define a type array with strings using `as const`, generate a map out of it with `TestIdDirective.idsToMap`.
Use the map within template with [`TestIdDirective`](../api/debug-element-harness.md#testiddirective), and pass the array as an argument to [`DebugElementHarness`](../api/debug-element-harness.md).

:::note
`TestIdDirective` and `DebugElementHarness` work in conjunction, but they are optional.
They are just util functionality for this black-box integration testing approach.
:::

:::info
You can avoid usage of `TestIdDirective`, if you have your own directive to work with test attributes.
If you wish to continue working with `DebugElementHarness`, you need to pass your existing tests' attribute name as an argument to `DebugElementHarness`.
:::

### Example

```typescript
// test-ids.ts
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
  'errorMessage',
  'filterInput',
] as const;

export const testIdMap = TestIdDirective.idsToMap(testIds);
```

```typescript
// todos.component.ts
import {testIdMap} from './test-ids';
import {TestIdDirective} from 'ngx-testbox';

@Component({
  imports: [TestIdDirective],
})
class TodosComponent {
  testIds = testIdMap;
}
```

```html
<!-- todos.component.html -->
<div [testboxTestId]="testIds.todoList">
  @for (todo of todos; track todo.id) {
    <div [testboxTestId]="testIds.todoItem">
      <span [testboxTestId]="testIds.todoTitle">{{ todo.title }}</span>
      <span [testboxTestId]="testIds.todoStatus">{{ todo.completed ? 'Completed' : 'Active' }}</span>
      <button [testboxTestId]="testIds.editTodoButton" (click)="editTodo(todo)">Edit</button>
      <button [testboxTestId]="testIds.deleteTodoButton" (click)="deleteTodo(todo.id)">Delete</button>
    </div>
  }
</div>

<form [testboxTestId]="testIds.todoForm" (ngSubmit)="addTodo()">
  <input [testboxTestId]="testIds.todoInput" [(ngModel)]="newTodo" name="newTodo" />
  <button [testboxTestId]="testIds.addTodoButton" type="submit">Add Todo</button>
</form>

@if (errorMessage) {
  <p [testboxTestId]="testIds.errorMessage">{{ errorMessage }}</p>
}
```

---

## Writing tests

The core functionality is hidden behind the stabilization function. All you need to focus on is what matters for your features:

1. Trigger user actions (`click`, `input`, etc.).
2. Call the stabilization function with the right HTTP call instructions.
3. Assert on DOM state via the harness.

:::tip[Test internal state]
You can combine both approaches black and white box testing in components if you wish.
But be careful; the more your tests know about codebase internals, the harder it is to maintain such tests.
:::

:::tip[Unit testing]
Unit tests ideally serve for white-box testing.
It's a good approach to test internal state in isolation, but you don't need to use ngx-testbox for it.
:::

:::danger
If you need to test a specific method result, don't test the method was ever called.
Instead try to test effects the method made.
Otherwise, you increase both tests and codebase structure coupling, which leads to harder project's maintenance.
:::

---

## Example: Async/await approach (recommended)

```typescript
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElementHarness, predefinedHttpCallInstructionsAsync, runTasksUntilStableAsync} from 'ngx-testbox/testing';
import {TodosComponent} from './todos.component';
import {FormsModule} from '@angular/forms';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

describe('TodosComponent (async)', () => {
  let fixture: ComponentFixture<TodosComponent>;
  let harness: DebugElementHarness<typeof testIds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosComponent, FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosComponent);
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should load todos on initialization', async () => {
    // Arrange
    const mockTodos = [
      {id: 1, title: 'Buy fruits', completed: false},
      {id: 2, title: 'Watch baseball', completed: true},
    ];

    // Act
    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.get.success(
          'https://DOMAIN/api/todos',
          () => mockTodos
        ),
      ],
    });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(2);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy fruits');
    expect(harness.elements.todoStatus.getTextContent(todoItems[0])).toContain('Active');
    expect(harness.elements.todoTitle.getTextContent(todoItems[1])).toContain('Watch baseball');
    expect(harness.elements.todoStatus.getTextContent(todoItems[1])).toContain('Completed');
  });

  it('should show error message when loading todos fails', async () => {
    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.get.error(
          'https://DOMAIN/api/todos',
          () => ({message: 'Failed to load todos'})
        ),
      ],
    });

    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).not.toBeNull();
    expect(harness.elements.errorMessage.getTextContent()).toContain('Failed to load todos');
  });

  it('should add a new todo when form is submitted', async () => {
    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.get.success(
          'https://DOMAIN/api/todos',
          () => []
        ),
      ],
    });

    // Act
    harness.elements.todoInput.inputValue('Buy groceries');
    harness.elements.addTodoButton.click();

    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.post.success(
          'https://DOMAIN/api/todos',
          (req) => {
            const body = JSON.parse(req.body as string);
            return {id: 1, title: body.title, completed: false};
          }
        ),
      ],
    });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy groceries');
  });

  it('should filter todos when filter input changes', async () => {
    const allTodos = [
      {id: 1, title: 'Learn Angular', completed: false},
      {id: 2, title: 'Build an app', completed: true},
      {id: 3, title: 'Deploy Angular app', completed: false},
    ];

    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructionsAsync.get.success(
          'https://DOMAIN/api/todos',
          () => allTodos
        ),
      ],
    });

    // Act
    harness.elements.filterInput.inputValue('Angular');

    await runTasksUntilStableAsync(fixture, {
      httpCallInstructions: [
        [
          ['https://DOMAIN/api/todos', 'GET'],
          (req, searchParams) => {
            const searchString = searchParams.get('title') || '';
            const filtered = allTodos.filter(({title}) => title.includes(searchString));
            return new HttpResponse({body: filtered, status: 200});
          },
        ],
      ],
    });

    // Assert
    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(2);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Learn Angular');
    expect(harness.elements.todoTitle.getTextContent(todoItems[1])).toContain('Deploy Angular app');
  });
});
```

---

## Example: fakeAsync approach

```typescript
import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {DebugElementHarness, predefinedHttpCallInstructions, runTasksUntilStable} from 'ngx-testbox/testing';
import {TodosComponent} from './todos.component';
import {FormsModule} from '@angular/forms';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {HttpResponse} from '@angular/common/http';

describe('TodosComponent (fakeAsync)', () => {
  let fixture: ComponentFixture<TodosComponent>;
  let harness: DebugElementHarness<typeof testIds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosComponent, FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosComponent);
    harness = new DebugElementHarness(fixture.debugElement, testIds);
  });

  it('should load todos on initialization', fakeAsync(() => {
    const mockTodos = [
      {id: 1, title: 'Buy fruits', completed: false},
      {id: 2, title: 'Watch baseball', completed: true},
    ];

    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.get.success(
          'https://DOMAIN/api/todos',
          () => mockTodos
        ),
      ],
    });

    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(2);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy fruits');
    expect(harness.elements.todoStatus.getTextContent(todoItems[0])).toContain('Active');
    expect(harness.elements.todoTitle.getTextContent(todoItems[1])).toContain('Watch baseball');
    expect(harness.elements.todoStatus.getTextContent(todoItems[1])).toContain('Completed');
  }));

  it('should show error message when loading todos fails', fakeAsync(() => {
    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.get.error(
          'https://DOMAIN/api/todos',
          () => ({message: 'Failed to load todos'})
        ),
      ],
    });

    const errorMessage = harness.elements.errorMessage.query();
    expect(errorMessage).not.toBeNull();
    expect(harness.elements.errorMessage.getTextContent()).toContain('Failed to load todos');
  }));

  it('should add a new todo when form is submitted', fakeAsync(() => {
    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.get.success(
          'https://DOMAIN/api/todos',
          () => []
        ),
      ],
    });

    harness.elements.todoInput.inputValue('Buy groceries');
    harness.elements.addTodoButton.click();

    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.post.success(
          'https://DOMAIN/api/todos',
          (req) => {
            const body = JSON.parse(req.body as string);
            return {id: 1, title: body.title, completed: false};
          }
        ),
      ],
    });

    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(1);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Buy groceries');
  }));

  it('should filter todos when filter input changes', fakeAsync(() => {
    const allTodos = [
      {id: 1, title: 'Learn Angular', completed: false},
      {id: 2, title: 'Build an app', completed: true},
      {id: 3, title: 'Deploy Angular app', completed: false},
    ];

    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        predefinedHttpCallInstructions.get.success(
          'https://DOMAIN/api/todos',
          () => allTodos
        ),
      ],
    });

    harness.elements.filterInput.inputValue('Angular');

    runTasksUntilStable(fixture, {
      httpCallInstructions: [
        [
          ['https://DOMAIN/api/todos', 'GET'],
          (req, searchParams) => {
            const searchString = searchParams.get('title') || '';
            const filtered = allTodos.filter(({title}) => title.includes(searchString));
            return new HttpResponse({body: filtered, status: 200});
          },
        ],
      ],
    });

    const todoItems = harness.elements.todoItem.queryAll();
    expect(todoItems.length).toBe(2);
    expect(harness.elements.todoTitle.getTextContent(todoItems[0])).toContain('Learn Angular');
    expect(harness.elements.todoTitle.getTextContent(todoItems[1])).toContain('Deploy Angular app');
  }));
});
```

---

## Harness extension pattern

For reusable component-specific interactions, extend `DebugElementHarness`:

```typescript
import {DebugElementHarness} from 'ngx-testbox/testing';
import {testIds} from './test-ids';

export class TodosHarness extends DebugElementHarness<typeof testIds> {
  constructor(debugElement: DebugElement) {
    super(debugElement, testIds);
  }

  setTodoInputValue(value: string): void {
    this.elements.todoInput.inputValue(value);
  }

  addTodo(): void {
    this.elements.addTodoButton.click();
  }

  getTodoTitles(): string[] {
    return this.elements.todoItem
      .queryAll()
      .map((el) => this.elements.todoTitle.getTextContent(el));
  }
}
```
