const { parseCsv } = require('../../src/utils/csvParser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

describe('Unit: CSV Parser', () => {
    let tmpFile;

    beforeEach(() => {
        tmpFile = path.join(os.tmpdir(), `jest-test-${crypto.randomUUID()}.csv`);
    });

    afterEach(() => {
        if (fs.existsSync(tmpFile)) {
            fs.unlinkSync(tmpFile);
        }
    });

    // ── Happy path ───────────────────────────────────────────
    it('parses a CSV with headers and two data rows', async () => {
        fs.writeFileSync(tmpFile, 'name,email\nJohn,john@test.com\nJane,jane@test.com');
        const result = await parseCsv(tmpFile);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('John');
        expect(result[0].email).toBe('john@test.com');
        expect(result[1].name).toBe('Jane');
        expect(result[1].email).toBe('jane@test.com');
    });

    it('returns an array of plain objects (not arrays)', async () => {
        fs.writeFileSync(tmpFile, 'key,value\nfoo,bar');
        const result = await parseCsv(tmpFile);

        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toBeInstanceOf(Object);
        expect(result[0].key).toBe('foo');
        expect(result[0].value).toBe('bar');
    });

    it('trims whitespace from values', async () => {
        fs.writeFileSync(tmpFile, 'name,city\n  Alice  ,  Mumbai  ');
        const result = await parseCsv(tmpFile);

        expect(result[0].name).toBe('Alice');
        expect(result[0].city).toBe('Mumbai');
    });

    it('parses a single data row correctly', async () => {
        fs.writeFileSync(tmpFile, 'id,amount\n1,5000');
        const result = await parseCsv(tmpFile);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
        expect(result[0].amount).toBe('5000');
    });

    it('parses CSV with header only (empty data) as empty array', async () => {
        fs.writeFileSync(tmpFile, 'name,email\n');
        const result = await parseCsv(tmpFile);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    it('skips blank lines inside the CSV', async () => {
        fs.writeFileSync(tmpFile, 'name,email\nAlice,a@test.com\n\nBob,b@test.com\n');
        const result = await parseCsv(tmpFile);

        // skip_empty_lines: true means blank lines are ignored
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice');
        expect(result[1].name).toBe('Bob');
    });

    it('returns a Promise', async () => {
        fs.writeFileSync(tmpFile, 'a,b\n1,2');
        const returnValue = parseCsv(tmpFile);
        expect(returnValue).toBeInstanceOf(Promise);
        await returnValue;
    });

    // ── Error / edge cases ────────────────────────────────────
    it('rejects with an error for a non-existent file path (mocked stream)', async () => {
        // On Windows, fs.createReadStream for missing files emits an error on the
        // source stream but pipes don't forward it to csv-parse's error event.
        // We mock createReadStream to emit the error so we can test rejection.
        const { EventEmitter } = require('events');
        const fakeStream = new EventEmitter();
        fakeStream.pipe = jest.fn(() => {
            const dest = new EventEmitter();
            // Emit the error asynchronously so the pipe chain is set up first
            setImmediate(() => dest.emit('error', new Error('ENOENT: no such file or directory')));
            dest.pipe = jest.fn(() => dest);
            return dest;
        });

        const spy = jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(fakeStream);

        await expect(parseCsv('/non/existent/path/missing.csv')).rejects.toThrow('ENOENT');

        spy.mockRestore();
    });

    it('rejects with an error for an invalid path type', async () => {
        await expect(parseCsv(null)).rejects.toThrow();
    });
});
