const { ApiError } = require('../utils/response')

/**
 * validate(schema, 'body' | 'query' | 'params')
 * Parses with Zod and replaces req[source] with the parsed (typed / coerced) data.
 * On failure answers 400 with the first human readable message.
 */
const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const first = result.error.issues[0]
      const generic = first.message === 'Required' || first.message === 'Invalid input' || /^(Expected|Invalid)\b/.test(first.message)
      const field = first.path.length ? first.path.join('.') : ''
      return next(new ApiError(400, generic && field ? `${field}: ${first.message}` : first.message))
    }
    // req.query is a getter in Express 5 but a plain property in Express 4; define it explicitly to be safe.
    Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true, enumerable: true })
    next()
  }

module.exports = { validate }
