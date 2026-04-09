import jwt from 'jsonwebtoken'
import { getRequiredEnv } from './env.js'

const getJwtSecret = () => {
  const secret = getRequiredEnv('JWT_SECRET')

  if (!secret) {
    throw new Error('JWT_SECRET missing')
  }

  return secret
}

export const signUserToken = (user) => jwt.sign(
  { userId: user._id.toString() },
  getJwtSecret(),
  { expiresIn: '7d' }
)

export const signAdminToken = (email) => jwt.sign(
  { role: 'admin', email },
  getJwtSecret(),
  { expiresIn: '7d' }
)

export const verifyToken = (token) => jwt.verify(token, getJwtSecret())
