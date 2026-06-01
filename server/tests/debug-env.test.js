describe('Environment Debug', () => {
    test('Check CWD and Modules', () => {
        console.log('DEBUG: CWD:', process.cwd());
        try {
            require('dotenv');
            console.log('DEBUG: Dotenv OK');
            require('mongoose');
            console.log('DEBUG: Mongoose OK');
            const conf = require('../src/config/env');
            console.log('DEBUG: Config OK', conf);
        } catch (e) {
            console.error('DEBUG: ERROR:', e.message);
            throw e;
        }
    });
});
