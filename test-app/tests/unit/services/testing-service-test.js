import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { TaskMock } from 'ember-concurrency-mock/test-support/tasks';
import { timeout } from 'ember-concurrency';

module('Unit | Service | testingService', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.service = this.owner.lookup('service:testing-service');
    this.taskMock = new TaskMock(this.service, 'dropTask');
  });

  test('allows for callsFake', async function (assert) {
    assert.expect(2);

    let data = "hello";

    this.taskMock.callsFake(() => {
      assert.ok(true, "fake was called");
      return data;
    });

    let result = await this.service.dropStart();
    assert.equal(result, data, 'returned value equals');
  });

  test('allows for resolve', async function (assert) {
    assert.expect(1);
    let data = {msg: "hello"};

    this.taskMock.resolves(data);

    let result = await this.service.dropStart();
    assert.equal(result?.msg, data.msg, 'resolved value equals');
  });

  test('allows for reject', async function (assert) {
    assert.expect(1);
    let data = {msg: "hello"};

    this.taskMock.rejects(data);

    this.service.dropStart().catch(error => {
      assert.equal(error.msg, data.msg);
    });
  });

  test('Honors annotation', async function (assert) {
    assert.expect(1);
    let data = {msg: "hello"};

    this.taskMock.callsFake(async () => {
      await timeout(100);
      assert.ok(true);
    });

    this.service.dropStart();
    this.service.dropStart();
    this.service.dropStart();
  });

  test('Allows for testing is running', async function (assert) {
    this.service.dropStart();

    assert.ok(this.taskMock.task.isRunning, 'task is running');
    await this.taskMock.finishTask();
    assert.ok(this.taskMock.task.isRunning === false, 'task is running');
  });
});
