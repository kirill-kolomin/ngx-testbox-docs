---
sidebar_position: 1
---

# Component integration testing

## Prerequisites

Integration testing has one big advantage over unit tests—integration ones may cover entire features.
On the other hand, despite e2e tests are more reliable, but are cumbersome and require additional effort to set them up.
The black-box integration testing shows awesome results.
It is straightforward to set up.
It doesn't require additional effort for installing on CI/CD pipelines.
It keeps code base maintainable and well shaped.

Prerequisites for setting black-box integration tests up:
1. You need to know your approximate REST API contract with your server.
2. You need to know the main elements on the page to set tests against them.
3. Install ngx-testbox
