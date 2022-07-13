import sinon from 'sinon';
import { resolve, rejects } from 'rsvp';
import { task } from 'ember-concurrency';

export function stubTask(task, f) {
  if (f) {
    return sinon.stub(task, 'perform').callsFake(f);
  } else {
    return sinon.stub(task, 'perform');
  }
}

/**
 * Allows mocking of a task for testing. Under the covers it uses an internal task, so taskMock.task is the
 * internal task for all the task properties
 *
 * Basic usage for mocking a task
 *
 *     // Creates a mock of the task that returns the given data instead of calling perform
 *     new TaskMock(this.myService, 'getInvoiceReportingCountsTask').returns({});
 *
 *     // Creates a mock that calls a function instead of perform
 *    new TaskMock(this.myService, 'getAllBulletinsForAdminTask').callsFake(() => {
 *      assert.ok(true);
 *      return resolve([]);
 *    });
 *
 *    // Creates a task mock that waits to enable testing things like isRunning.
 *    // call finishTask to end the task and allow the test to continue. Resolved data can be passed.
 *    // call rejectTask to test a failing task
 *    const mockTask = new TaskMock(service, 'submitQueueTask');
 *    assert.ok(service.submitDisabled, "submit is disabled");  // submit is disabled while the task is running
 *    mockTask.finishTask([]);
 *
 *
 *    // The task property of the mock allows access to the task used for testing.
 *    // This is an internal task, not the real task that was mocked
 *    const mockTask = new TaskMock(service, 'submitQueueTask').returns({});
 *    mockTask.task.lastSuccessful
 */
export class TaskMock {
  _internalTask;
  finishTask;
  rejectTask;

  constructor(object, taskName, mockOptions) {
    const options = mockOptions || this.createOptions(object, taskName);

    const InternalTask = class {
      _fakeMethod;
      promise;
      finishTask;
      rejectTask;

      constructor() {
        this.promise = new Promise((resolve, reject) => {
          this.finishTask = resolve;
          this.rejectTask = reject;
        });
      }
      debugger;
      @task(options)
      *task() {
        if (this._fakeMethod === undefined) {
          return yield this.promise;
        }

        return this._fakeMethod?.(...arguments);
      }
    };

    this._internalTask = new InternalTask();
    if (object) {
      sinon.stub(object, taskName).value(this._internalTask.task);
      this.performSpy = sinon.spy(this._internalTask.task, 'perform');
    }
    this.finishTask = this._internalTask.finishTask;
    this.rejectTask = this._internalTask.rejectTask;
  }

  createOptions(object, taskName) {
    const task = object[taskName];
    const schedulerPolicy = task?.scheduler?.schedulerPolicy;
    const policyName = schedulerPolicy?.constructor.name;

    let options = {};

    if (task?.group) {
      options.group = task.group;
    }
    if (schedulerPolicy?.maxConcurrency) {
      options.maxConcurrency = schedulerPolicy.maxConcurrency;
    }

    switch (policyName) {
      case 'RestartablePolicy':
        options.restartable = true;
        break;
      case 'DropPolicy':
        options.drop = true;
        break;
      case 'KeepLatestPolicy':
        options.keepLatest = true;
        break;
      case 'EnqueuePolicy':
        options.enqueue = true;
        break;
    }

    return options;
  }

  get task() {
    return this._internalTask.task;
  }

  callsFake(method) {
    this._internalTask._fakeMethod = method;
    return this;
  }

  resolves(data) {
    this._internalTask._fakeMethod = () => {
      return resolve(data);
    };
    return this;
  }

  rejects(data) {
    this._internalTask._fakeMethod = () => {
      return rejects(data);
    };
    return this;
  }
}
