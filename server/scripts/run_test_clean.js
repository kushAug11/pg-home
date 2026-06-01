const { spawn } = require('child_process');

const run = () => {
    const child = spawn('npm.cmd', ['test', 'tests/exit_workflow.test.js'], { shell: true, stdio: 'pipe' });

    const fs = require('fs');
    const logStream = fs.createWriteStream('clean_log.txt');

    child.stdout.on('data', (data) => {
        logStream.write(data.toString());
        console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
        logStream.write(data.toString());
        console.error(data.toString());
    });

    child.on('close', (code) => {
        logStream.end();
        console.log(`Child process exited with code ${code}`);
    });

};

run();
