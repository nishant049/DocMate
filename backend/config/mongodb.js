import mongoose from "mongoose";

const DEFAULT_DB_NAME = 'prescripto'

const buildMongoUri = () => {
  const mongoUri = process.env.MONGO_URI?.trim()
  const dbName = process.env.MONGO_DB_NAME?.trim() || DEFAULT_DB_NAME

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in backend/.env')
  }

  let parsedUri

  try {
    parsedUri = new URL(mongoUri)
  } catch (error) {
    throw new Error(`Invalid MONGO_URI: ${error.message}`)
  }

  parsedUri.pathname = `/${dbName}`

  return {
    mongoUri: parsedUri.toString(),
    dbName,
    host: parsedUri.host
  }
}

const registerMongoListeners = () => {
  mongoose.connection.removeAllListeners('connected')
  mongoose.connection.removeAllListeners('error')
  mongoose.connection.removeAllListeners('disconnected')

  mongoose.connection.on('connected', () => {
    console.log('MongoDB Connected')
  })

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB Error:', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB Error: connection disconnected')
  })
}

const connectDB = async () => {
  const { mongoUri, dbName, host } = buildMongoUri()

  registerMongoListeners()
  console.log(`Connecting to MongoDB host=${host} db=${dbName}`)

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    })
    console.log(`MongoDB Ready host=${host} db=${dbName}`)
  } catch (error) {
    console.error('MongoDB Error:', error)
    throw error
  }
}

export default connectDB
