const app = require('../src/app');

describe('App Module', () => {
    it('should export an express app', () => {
        expect(app).toBeDefined();
        // expect(app.mountpath).toBe('/'); 
    });
});
