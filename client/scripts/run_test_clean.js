const { spawn } = require('child_process');
const fs = require('fs');

const run = () => {
    // Ensure scripts dir exists if I placed it there, but I'll write to root to be safe or use relative
    // Actually I'll write this file to client/scripts/run_test_clean.js

    console.log("Starting Client Tests...");
    const child = spawn('npm.cmd', ['test'], { shell: true, stdio: 'pipe' });

    const logStream = fs.createWriteStream('clean_log.txt');

    child.stdout.on('data', (data) => {
        const str = data.toString();
        logStream.write(str);
        console.log(str);
    });

    child.stderr.on('data', (data) => {
        const str = data.toString();
        logStream.write(str);
        console.error(str);
    });

    child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
        logStream.end();
    });
};

run();
