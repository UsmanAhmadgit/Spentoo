const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const backendPath = path.join(__dirname, '..', 'backened', 'Spentoo');
const isWindows = os.platform() === 'win32';
const mvnwCommand = isWindows ? 'mvnw.cmd' : './mvnw';

// Check if mvnw exists
const mvnwPath = path.join(backendPath, isWindows ? 'mvnw.cmd' : 'mvnw');
if (!fs.existsSync(mvnwPath)) {
  console.error(`Error: Maven wrapper not found at ${mvnwPath}`);
  process.exit(1);
}

console.log('Starting Spring Boot backend...');
console.log(`Backend path: ${backendPath}`);
console.log(`Using: ${mvnwCommand}`);

const backendProcess = spawn(mvnwCommand, ['spring-boot:run'], {
  cwd: backendPath,
  shell: true,
  stdio: 'inherit'
});

backendProcess.on('error', (error) => {
  console.error(`Failed to start backend: ${error.message}`);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Backend process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping backend...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  backendProcess.kill('SIGTERM');
  process.exit(0);
});

