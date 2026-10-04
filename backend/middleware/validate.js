// Zod-based request validation middleware.
// Usage: router.post('/', validate(schema), handler)
//        router.get('/lookup', validate(schema, 'query'), handler)
// On success, replaces req[source] with the parsed (typed + stripped) data.
// On failure, returns 400 with a Mongolian message and field-level details.

export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
        const issues = result.error.issues.map(i => ({
            path: i.path.join('.') || source,
            message: i.message
        }))
        return res.status(400).json({
            message: issues[0]?.message || 'Буруу өгөгдөл',
            errors: issues
        })
    }
    req[source] = result.data
    next()
}

// router.param handler: reject a malformed MongoDB id with 400 before any
// handler runs, instead of letting the database throw a CastError (500).
// Usage: router.param('id', objectIdParam)
export const objectIdParam = (req, res, next, value) => {
    if (!/^[a-f\d]{24}$/i.test(value)) {
        return res.status(400).json({ message: 'Буруу ID' })
    }
    next()
}
