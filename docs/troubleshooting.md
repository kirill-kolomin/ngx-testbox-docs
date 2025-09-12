---
sidebar_position: 4
---

# Troubleshooting

There might be differences among Angular's versions that cause unexpected behaviour.
On this page I described the cases that may occur while writing tests with Angular.

###  Periodic timers in the queue error.

Errors that mention periodic timers mean there is still a running `setInterval` - "1 periodic timer(s) still in the queue."

**Ngx-testbox** will warn you if it detects a `setInterval`, and logs in console the stack trace for you to easier find the place of `setInterval`.

You need to choose between 2 options:
- Mock the place where the `setInterval` is running.
- Put the `setInterval` outside the ng zone, using `this.ngZone.runOutsideAngular(() => setInterval(...))`,
going this way Angular won't track the `setInterval` for stabilizing the zone.

An other issue may happen if you choose to put it inside function `runOutsideAngular`.
By an unknown reason within Angular 17 and earlier, you will constantly get the error "1 periodic timer(s) still in the queue." at the end of tests.
The only option you have to resolve it is to use the `discardPeriodicTasks` function at the end of your test.
For sure, starting from Angular 18 it works fine.

### HTTP requests don't affect zone stability.

The issue when Angular zone is treated as stable even despite the fact there are pending HTTP requests in the queue.
The reason is unknown to me.
But you don't need to worry about it because **Ngx-Testbox** handles the case appropriately.

