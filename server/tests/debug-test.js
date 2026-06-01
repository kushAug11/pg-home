const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Run just the app import test
    console.log('Running test...');
    const output = execSync('npm test tests/app-import.test.js', { encoding: 'utf8', stdio: 'pipe' });
    console.log('Success:', output);
} catch (e) {
    console.log('Test Failed!');
    console.log('--- STDOUT ---');
    console.log(e.stdout);
    console.log('--- STDERR ---');
    console.log(e.stderr);

    fs.writeFileSync('test-debug.log', e.stderr || e.stdout);
}
