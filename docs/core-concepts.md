---
sidebar_position: 2
---

# Core concepts

**Ngx-testbox is a powerful tool for setting up black-box integration tests with minimal effort and full confidence in your codebase.**

## Two approaches for testing

Ngx-testbox supports two stabilization strategies to accommodate different Angular application architectures:

### Async/await approach (recommended default)
This is the modern path. It works with both **zoneful** and **zoneless** Angular applications and uses `async/await` with `runTasksUntilStableAsync`.

- Use `predefinedHttpCallInstructionsAsync` to build HTTP call instructions.
- Response getters can be asynchronous (return a `Promise`).
- Time advances naturally or through a fake timer callback.

### fakeAsync approach
The classic path using Angular's `fakeAsync` zone and virtual time via `tick()`.

- Use `predefinedHttpCallInstructions` to build HTTP call instructions.
- Response getters must be synchronous.
- Time is simulated via `tick(ms)`.

See [Choosing your approach](approaches/choosing-your-approach.md) for a detailed comparison.

---

## Combination of strict control with simple maintenance

With ngx-testbox, you stay in full control of asynchronous operations.
Every unexpected request or task is surfaced immediately, so nothing slips through unnoticed.

At the same time, the library provides convenient utilities to enhance your development experience, such as [predefined http call instructions](api/predefined-http-call-instructions.md) and convenient [harnesses for DOM interaction](api/debug-element-harness.md).

## Focus on features, not on code

Human error causes many test failures — especially when developers try to mock complex internal logic.
This makes test cases larger, harder to maintain, and less readable.

**Ngx-testbox solves this by encouraging black-box testing.**
Instead of worrying about internals, you focus only on features and expected outcomes.
The result: smaller, clearer, and more reliable tests.

## UX-centric approach

Ngx-testbox helps you ensure that your components behave correctly from the user's perspective.
It's not enough for an internal `loading` flag to be `false` if the spinner is still rolling on the screen.
You test what users will see on the screen, what they will experience, which is what ultimately matters most in your application.

## What makes it work

Angular provides a unique advantage: it tracks all asynchronous operations.
Ngx-testbox builds on this by waiting until the application is completely stable before returning control back to your test case assertions.

This means:

- All HTTP requests are resolved.
- All DOM elements have finished updating.
- No unexpected changes occur during test execution.

In complex apps, one request may trigger several more.
Ngx-testbox takes full control over async operations in the Zone, including HTTP, based on your defined [HTTP call instructions](api/http-call-instruction.md) at each step.
This gives you deterministic, stable test runs every time.

## Test-Driven Development

Ngx-testbox also makes Test-Driven Development (TDD) practical.
You can quickly write simple tests first, then implement the logic later.
All you need is:

- An approximate REST API contract with your server.
- The main UI elements for the feature you're building.

This lowers the barrier to adopting TDD in Angular projects.
