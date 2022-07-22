ember-concurrency-mock
==============================================================================

Provides a test helper in mocking out ember concurrency tasks. 


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v12 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-concurrency-mock
```


Usage
------------------------------------------------------------------------------

Create an instance of TaskMock providing the object and task to mock. This works very similar to 
sinon in stubbing a method. Sinon is used to perform the actual stub.

Basic usage of creating a TaskMock
```js
    import { TaskMock } from 'ember-concurrency-mock/test-support/tasks';
    import { resolve } from 'rsvp';

     // Creates a mock of the task that returns the given data
     new TaskMock(this.myService, 'getInvoiceReportingCountsTask').resolves({});

    // Creates a mock of the task that fails with the given data
    new TaskMock(this.myService, 'getInvoiceReportingCountsTask').rejects({});

    // Creates a mock that calls a function 
    new TaskMock(this.myService, 'getAllBulletinsForAdminTask').callsFake(() => {
        assert.ok(true);
        return resolve([]);
    });

```

You can get access to the underlying task if needed by saving the TaskMock instance created
```js
    const mockTask = new TaskMock(service, 'submitQueueTask').resolves({});
    // code that would call the task
    
    // access to the task that was created for the mock is done with the task property. 
    // This is an actual task so you can access things like isSuccessful
    assert.ok(mockTask.task.isSuccessful);

```

The mock also gives you the ability to test things like isRunning by creating a mock with no function or resolves.
You than then complete or reject the task at a later time by calling finishTask() or rejectTask() providing data
if needed

```js
    const mockTask = new TaskMock(service, 'submitQueueTask');
    // submit is disabled while the task is running
    assert.ok(service.submitDisabled, "submit is disabled");  
    mockTask.finishTask([]);

```

If you would like to inspect the task that was run for parameters that were passed, or how many times the 
task was calls, a sinon spy named performSpy is created on the mocked task.
```js
    const mockTask = new TaskMock(service, 'submitQueueTask').resolves([]);
    // code that would call the task
    assert.ok(mockTask.performSpy.calledOnce);

```

Because the task is a mock, it attempts to simulate the overridden task as much as possible. 
If the task that is being mocked is annotated with `@task({drop:true})` for example, the mocked task
will also be marked accordingly and behave as a dropable task. 

Passable Task

If you need to create a mocked task that is passed into a component, you can by not 
passing an object and task name 
```js
    this.mockTask = new TaskMock().resolves([]);
    await render(hbs`<MyComp @task={{this.mockTask.task}} />`);
```


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
