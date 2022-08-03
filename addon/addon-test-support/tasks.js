import sinon from 'sinon';
import { resolve, reject } from 'rsvp';
import { task } from 'ember-concurrency';
import { assert } from '@ember/debug';

export class TaskMock {
  _internalTask;
  finishTask;
  rejectTask;

  constructor(object, taskName, mockOptions) {
    // Did they pass only mockOptions
    if (arguments.length === 1) {
      mockOptions = object;
      object = undefined;
    }
    if (arguments.length >= 2) {
      assert('Object can not be undefined', object);
      assert('Method can not be undefined', taskName);
    }

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
    let options = {};

    if (object) {
      const task = object[taskName];
      const schedulerPolicy = task?.scheduler?.schedulerPolicy;
      const policyName = schedulerPolicy?.constructor.name;

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
      return reject(data);
    };
    return this;
  }
}
