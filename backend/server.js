import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import { corsOptions } from './config/cors.js'
import { validateRequiredEnv } from './utils/env.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

validateRequiredEnv(['JWT_SECRET', 'MONGO_URI'])

// app config
const app = express()
const port = process.env.PORT || 4000
const host = process.env.HOST || '0.0.0.0'

// middlewares
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'direct'}`)
  }

  next()
})
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

// api end point
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)

app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'OK' : 'ERROR',
    message: isDbConnected ? 'Server is running' : 'Database is not connected',
    timestamp: new Date(),
    databaseState: mongoose.connection.readyState
  })
})

app.get('/', (req, res) => {
  res.send('Api working...')
})

app.use((error, req, res, next) => {
  console.error('FULL ERROR:', error)

  if (res.headersSent) {
    return next(error)
  }

  if (error?.message?.includes('not allowed by CORS')) {
    return res.status(403).json({ success: false, message: error.message })
  }

  if (error?.code === 11000) {
    return res.status(400).json({ success: false, message: 'Email already registered' })
  }

  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || 'Server Error'
  })
})

const startServer = async () => {
  try {
    await connectDB()
    await connectCloudinary()
    app.listen(port, host, () => console.log(`Server running on port ${port} (host ${host})`))
  } catch (error) {
    console.error('FULL ERROR:', error)
    process.exit(1)
  }
}

startServer()
