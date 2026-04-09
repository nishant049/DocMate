import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import { signUserToken } from '../utils/jwt.js'
import { handleControllerError, sendError, sendSuccess } from '../utils/response.js'

const normalizeEmail = (email) => email.trim().toLowerCase()

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !password || !email) {
      return sendError(res, 400, 'Missing details')
    }

    const normalizedEmail = normalizeEmail(email)

    if (!validator.isEmail(normalizedEmail)) {
      return sendError(res, 400, 'Enter a valid email')
    }

    if (password.length < 8) {
      return sendError(res, 400, 'Enter a strong password')
    }

    const existingUser = await userModel.findOne({ email: normalizedEmail })

    if (existingUser) {
      return sendError(res, 400, 'User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    })

    const token = signUserToken(user)

    return sendSuccess(
      res,
      201,
      'User registered successfully',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      { token }
    )
  } catch (error) {
    return handleControllerError(res, error, { duplicateKeyMessage: 'Email already registered' })
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return sendError(res, 400, 'Missing email or password')
    }

    const normalizedEmail = normalizeEmail(email)
    const user = await userModel.findOne({ email: normalizedEmail })

    if (!user) {
      return sendError(res, 401, 'Invalid credentials')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials')
    }

    const token = signUserToken(user)

    return sendSuccess(
      res,
      200,
      'Login successful',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      { token }
    )
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const getProfile = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId
    const userData = await userModel.findById(userId).select('-password')

    if (!userData) {
      return sendError(res, 404, 'User not found')
    }

    return sendSuccess(
      res,
      200,
      'Profile fetched successfully',
      { user: userData },
      { userData }
    )
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const updateProfile = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId
    const { name, phone, address, dob, gender } = req.body
    const imageFile = req.file

    if (!name || !phone || !dob || !gender) {
      return sendError(res, 400, 'Data missing')
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender
    })

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
      const imageURL = imageUpload.secure_url

      await userModel.findByIdAndUpdate(userId, { image: imageURL })
    }

    return sendSuccess(res, 200, 'Profile updated')
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const bookAppointment = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId
    const { docId, slotDate, slotTime } = req.body

    const docData = await doctorModel.findById(docId).select('-password')

    if (!docData) {
      return sendError(res, 404, 'Doctor not found')
    }

    if (!docData.available) {
      return sendError(res, 400, 'Doctor not available')
    }

    const slotsBooked = docData.slots_booked

    if (slotsBooked[slotDate]) {
      if (slotsBooked[slotDate].includes(slotTime)) {
        return sendError(res, 400, 'Slot not available')
      }

      slotsBooked[slotDate].push(slotTime)
    } else {
      slotsBooked[slotDate] = [slotTime]
    }

    const userData = await userModel.findById(userId).select('-password')
    const docSnapshot = docData.toObject()
    delete docSnapshot.password
    delete docSnapshot.slots_booked

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: docSnapshot,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now()
    }

    await appointmentModel.create(appointmentData)
    await doctorModel.findByIdAndUpdate(docId, { slots_booked: slotsBooked })

    return sendSuccess(res, 200, 'Appointment booked')
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const listAppointment = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId
    const appointments = await appointmentModel.find({ userId })

    return sendSuccess(
      res,
      200,
      'Appointments fetched successfully',
      { appointments },
      { appointments }
    )
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const cancelAppointment = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId
    const { appointmentId } = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData || appointmentData.userId.toString() !== userId) {
      return sendError(res, 403, 'Unauthorized action')
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    const { docId, slotDate, slotTime } = appointmentData
    const doctorData = await doctorModel.findById(docId)
    const slotsBooked = doctorData.slots_booked

    slotsBooked[slotDate] = slotsBooked[slotDate].filter((value) => value !== slotTime)

    await doctorModel.findByIdAndUpdate(docId, { slots_booked: slotsBooked })

    return sendSuccess(res, 200, 'Appointment cancelled')
  } catch (error) {
    return handleControllerError(res, error)
  }
}

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment }
