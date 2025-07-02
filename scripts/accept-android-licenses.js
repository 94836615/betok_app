#!/usr/bin/env node

/**
 * Script to automatically accept Android SDK licenses
 */

const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Determine the platform-specific sdkmanager command
const isWindows = os.platform() === 'win32';
const sdkmanager = isWindows ? 'sdkmanager.bat' : 'sdkmanager';

// Try to find the Android SDK location
function findAndroidSdkPath() {
  // Check common environment variables
  if (process.env.ANDROID_HOME) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT) {
    return process.env.ANDROID_SDK_ROOT;
  }
  
  // Check common locations based on OS
  const homeDir = os.homedir();
  
  if (isWindows) {
    const windowsPaths = [
      path.join(homeDir, 'AppData', 'Local', 'Android', 'sdk'),
      path.join('C:', 'Android', 'sdk')
    ];
    for (const p of windowsPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (os.platform() === 'darwin') { // macOS
    const macPaths = [
      path.join(homeDir, 'Library', 'Android', 'sdk')
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else { // Linux
    const linuxPaths = [
      path.join(homeDir, 'Android', 'Sdk'),
      path.join(homeDir, 'Android', 'sdk')
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  
  return null;
}

// Main function to accept licenses
function acceptLicenses() {
  try {
    const sdkPath = findAndroidSdkPath();
    
    if (!sdkPath) {
      console.error('Android SDK path not found. Please set ANDROID_HOME or ANDROID_SDK_ROOT environment variable.');
      process.exit(1);
    }
    
    const cmdToolsPath = path.join(sdkPath, 'cmdline-tools', 'latest', 'bin');
    const toolsPath = path.join(sdkPath, 'tools', 'bin');
    
    let sdkManagerPath;
    if (fs.existsSync(path.join(cmdToolsPath, sdkmanager))) {
      sdkManagerPath = path.join(cmdToolsPath, sdkmanager);
    } else if (fs.existsSync(path.join(toolsPath, sdkmanager))) {
      sdkManagerPath = path.join(toolsPath, sdkmanager);
    } else {
      console.error(`sdkmanager not found in ${cmdToolsPath} or ${toolsPath}`);
      process.exit(1);
    }
    
    console.log('Accepting Android SDK licenses...');
    
    // Create a yes stream to automatically accept all license prompts
    const command = `echo y | "${sdkManagerPath}" --licenses`;
    execSync(command, { stdio: 'inherit', shell: true });
    
    console.log('All Android SDK licenses accepted successfully!');
  } catch (error) {
    console.error('Error accepting Android SDK licenses:', error.message);
    process.exit(1);
  }
}

// Run the function
acceptLicenses();