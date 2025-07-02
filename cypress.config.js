const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('before:browser:launch', (browser, launchOptions) => {
        console.log('\n🚀 IMPORTANT: Make sure the web app is running with "npm run web" before starting Cypress tests!\n');
        return launchOptions;
      });
    },
    // Specify the path to the support file
    supportFile: 'cypress/support/e2e.js',
    // Specify the path to the fixtures folder
    fixturesFolder: 'cypress/fixtures',
    // Add a more descriptive error message for connection failures
    retries: {
      runMode: 2,
      openMode: 1
    },
  },
  // Use the TypeScript configuration in the Cypress directory
  typescript: {
    configFile: 'cypress/tsconfig.json'
  }
});
