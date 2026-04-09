import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import userModel from './models/userModel.js'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

const ADMIN_NAME = 'Super Admin'
const ADMIN_EMAIL = 'nishannt049@gmail.com'
const ADMIN_PASSWORD = 'hello@codex'
const DEFAULT_DB_NAME = 'prescripto'

const buildMongoUri = () => {
  const mongoUri = process.env.MONGO_URI?.trim()
  const dbName = process.env.MONGO_DB_NAME?.trim() || DEFAULT_DB_NAME

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined')
  }

  const parsedUri = new URL(mongoUri)
  parsedUri.pathname = `/${dbName}`

  return parsedUri.toString()
}

const connectToDatabase = async () => {
  const mongoUri = buildMongoUri()
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  })
}

const createAdmin = async () => {
  const normalizedEmail = ADMIN_EMAIL.toLowerCase()
  const existingAdmin = await userModel.findOne({ email: normalizedEmail })

  if (existingAdmin) {
    console.log('Admin already exists')
    return
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

  await userModel.create({
    name: ADMIN_NAME,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'admin'
  })

  console.log('Admin created successfully')
  console.log(`Email: ${ADMIN_EMAIL}`)
  console.log(`Password: ${ADMIN_PASSWORD}`)
}

const main = async () => {
  let exitCode = 0

  try {
    await connectToDatabase()
    await createAdmin()
  } catch (error) {
    exitCode = 1
    console.error('Error creating admin:', error)
  } finally {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }
    } catch (disconnectError) {
      exitCode = 1
      console.error('Error closing database connection:', disconnectError)
    }

    process.exit(exitCode)
  }
}

main()
