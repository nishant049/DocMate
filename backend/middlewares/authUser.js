import { sendError } from '../utils/response.js'
import { verifyToken } from '../utils/jwt.js'

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers

    if (!token) {
      return sendError(res, 401, 'Not authorized. Login again.')
    }

    const tokenDecode = verifyToken(token)
    const userId = tokenDecode.userId || tokenDecode.id

    if (!userId) {
      return sendError(res, 401, 'Invalid token')
    }

    req.body = req.body || {}
    req.userId = userId
    req.body.userId = userId

    next()
  } catch (error) {
    console.error('FULL ERROR:', error)

    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid or expired token')
    }

    return sendError(res, 500, 'Server configuration error')
  }
}

export default authUser
