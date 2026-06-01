const asyncHandler = require('../../src/utils/asyncHandler');

describe('Unit: asyncHandler', () => {
    it('calls next(error) when the wrapped async function throws', async () => {
        const error = new Error('something went wrong');
        const fn = asyncHandler(async () => {
            throw error;
        });
        const next = jest.fn();

        await fn({}, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(error);
    });

    it('does NOT call next when the async function resolves successfully', async () => {
        const fn = asyncHandler(async (req, res) => {
            res.status(200).json({ ok: true });
        });
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await fn({}, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('passes req, res, and next correctly to the wrapped function', async () => {
        const mockReq = { user: { id: 'abc' } };
        const mockRes = { send: jest.fn() };
        const mockNext = jest.fn();

        const innerFn = jest.fn().mockResolvedValue(undefined);
        const fn = asyncHandler(innerFn);

        await fn(mockReq, mockRes, mockNext);

        expect(innerFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('returns a function', () => {
        const wrapped = asyncHandler(async () => {});
        expect(typeof wrapped).toBe('function');
    });

    it('handles synchronous errors thrown inside async wrapper', async () => {
        const syncError = new TypeError('sync type error');
        const fn = asyncHandler(async () => {
            // eslint-disable-next-line no-throw-literal
            throw syncError;
        });
        const next = jest.fn();

        await fn({}, {}, next);

        expect(next).toHaveBeenCalledWith(syncError);
    });

    it('calls next with the exact error object (reference equality)', async () => {
        const specificError = new RangeError('out of range');
        const fn = asyncHandler(async () => { throw specificError; });
        const next = jest.fn();

        await fn({}, {}, next);

        expect(next.mock.calls[0][0]).toBe(specificError);
    });
});
