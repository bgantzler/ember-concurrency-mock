import Service from '@ember/service';
import { dropTask, timeout } from 'ember-concurrency';

export default class TestingServiceService extends Service {
  dropStart() {
    return this.dropTask.perform(...arguments);
  }

  @dropTask
  *dropTask() {
    timeout(1);
    return null;
  }
}
