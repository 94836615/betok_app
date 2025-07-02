#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },

  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

console.log(`${colors.fg.cyan}${colors.bright}=== Betok App Cypress Test Runner ===${colors.reset}`);
console.log(`${colors.fg.yellow}This script will start the web app and run Cypress tests${colors.reset}\n`);

// Check if the web app is already running
const checkWebApp = () => {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      host: 'localhost',
      port: 8081,
      path: '/',
      timeout: 2000
    };

    const req = http.get(options, (res) => {
      console.log(`${colors.fg.green}✓ Web app is already running on port 8081${colors.reset}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`${colors.fg.yellow}! Web app is not running on port 8081, will start it now${colors.reset}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`${colors.fg.yellow}! Connection to web app timed out, will start it now${colors.reset}`);
      resolve(false);
    });
  });
};

// Start the web app
const startWebApp = () => {
  console.log(`${colors.fg.cyan}Starting web app...${colors.reset}`);

  const webApp = spawn('npm', ['run', 'web'], {
    stdio: 'pipe',
    detached: true,
    shell: true
  });

  let webAppStarted = false;

  webApp.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Compiled successfully') || output.includes('localhost:8081')) {
      webAppStarted = true;
      console.log(`${colors.fg.green}✓ Web app started successfully${colors.reset}`);
      console.log(`${colors.fg.cyan}Starting Cypress tests...${colors.reset}\n`);
      startCypress();
    }
  });

  webApp.stderr.on('data', (data) => {
    console.error(`${colors.fg.red}Web app error: ${data}${colors.reset}`);
  });

  // Set a timeout to start Cypress even if we don't see the "Compiled successfully" message
  setTimeout(() => {
    if (!webAppStarted) {
      console.log(`${colors.fg.yellow}! Web app might be starting slowly, proceeding with Cypress tests anyway${colors.reset}`);
      startCypress();
    }
  }, 20000);

  // Keep track of the web app process to kill it later
  return webApp;
};

// Start Cypress
const startCypress = () => {
  const cypressMode = process.argv[2] === 'run' ? 'run' : 'open';
  const cypressArgs = ['run', 'cypress:' + cypressMode];

  // Add any additional arguments passed to this script
  if (process.argv.length > 3) {
    cypressArgs.push('--');
    cypressArgs.push(...process.argv.slice(3));
  }

  const cypress = spawn('npm', cypressArgs, {
    stdio: 'inherit',
    shell: true
  });

  cypress.on('close', (code) => {
    console.log(`\n${colors.fg.cyan}Cypress tests completed with exit code ${code}${colors.reset}`);
    process.exit(code);
  });
};

// Main function
const main = async () => {
  const isWebAppRunning = await checkWebApp();

  if (!isWebAppRunning) {
    const webApp = startWebApp();

    // Handle script termination
    process.on('SIGINT', () => {
      console.log(`\n${colors.fg.yellow}Terminating web app and Cypress${colors.reset}`);
      if (webApp && !webApp.killed) {
        process.kill(-webApp.pid);
      }
      process.exit(0);
    });
  } else {
    startCypress();
  }
};

main();
