import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
import { signAdminToken } from '../utils/jwt.js'
import { handleControllerError, sendError, sendSuccess } from '../utils/response.js'

const addDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
    const imageFile = req.file

    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
      return sendError(res, 400, 'Missing details')
    }

    if (!validator.isEmail(email)) {
      return sendError(res, 400, 'Please enter a valid email')
    }

    if (password.length < 8) {
      return sendError(res, 400, 'Please enter a strong password')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
    const imageUrl = imageUpload.secure_url

    await doctorModel.create({
      name,
      email: email.trim().toLowerCase(),
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now()
    })

    return sendSuccess(res, 201, 'Doctor added')
  } catch (error) {
    return handleControllerError(res, error, { duplicateKeyMessage: 'Doctor email already registered' })
  }
}

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = signAdminToken(email)
      return sendSuccess(res, 200, 'Login successful', { token }, { token })
    }

    return sendError(res, 401, 'Invalid credentials')
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password')

    return sendSuccess(res, 200, 'Doctors fetched successfully', { doctors }, { doctors })
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({})

    return sendSuccess(res, 200, 'Appointments fetched successfully', { appointments }, { appointments })
  } catch (error) {
    return handleControllerError(res, error)
  }
}

const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)

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

const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({})
    const users = await userModel.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      lastestAppointments: appointments.reverse().slice(0, 5)
    }

    return sendSuccess(res, 200, 'Dashboard fetched successfully', { dashData }, { dashData })
  } catch (error) {
    return handleControllerError(res, error)
  }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard }
