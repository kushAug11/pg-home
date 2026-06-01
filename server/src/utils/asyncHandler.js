/**
 * Async Handler Wrapper
 * Eliminates try-catch blocks in controllers.
 * usage: exports.myController = asyncHandler(async (req, res, next) => { ... })
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
