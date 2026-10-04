// Wraps an async Express handler so thrown/rejected errors are forwarded to the
// centralized error middleware instead of repeating try/catch in every controller.
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
