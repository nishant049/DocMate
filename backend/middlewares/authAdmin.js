import { sendError } from '../utils/response.js'
import { verifyToken } from '../utils/jwt.js'

const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers

    if (!atoken) {
      return sendError(res, 401, 'Not authorized. Login again.')
    }

    const tokenDecode = verifyToken(atoken)
    const isLegacyTokenValid = typeof tokenDecode === 'string' && tokenDecode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD
    const isSignedAdminTokenValid = tokenDecode?.role === 'admin' && tokenDecode.email === process.env.ADMIN_EMAIL

    if (!isLegacyTokenValid && !isSignedAdminTokenValid) {
      return sendError(res, 401, 'Not authorized. Login again.')
    }

    next()
  } catch (error) {
    console.error('FULL ERROR:', error)

    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid or expired token')
    }

    return sendError(res, 500, 'Server configuration error')
  }
}

export default authAdmin
