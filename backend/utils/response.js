// Every endpoint answers with the same envelope:
//   success: { success: true,  data, message? }
//   failure: { success: false, error }

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function ok(res, data, message, status = 200) {
  const body = { success: true, data }
  if (message) body.message = message
  return res.status(status).json(body)
}

module.exports = { ApiError, asyncHandler, ok }
