const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const config = require('../.detoxrc');

// Set the default timeout
jest.setTimeout(120000);

jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(specReporter);

beforeAll(async () => {
  await detox.init();
}, 300000);

beforeEach(async () => {
  try {
    await adapter.beforeEach();
  } catch (err) {
    // Workaround for the 'jest-jasmine' runner (default one): if 'beforeAll' hook above fails with a timeout,
    // unfortunately, 'jest' might continue running other tests. The 'beforeEach' hook will throw in this case,
    // and we need to catch it to avoid the misleading 'unhandled promise rejection' error.
    console.warn(err);
  }
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
