import { createContext, useState } from "react";
import { toast } from 'react-toastify'
import { api, apiBaseUrl, getApiErrorMessage } from '../lib/api'

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

  const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [dashData, setDashData] = useState(false)

  const backendUrl = apiBaseUrl

  const getAllDoctors = async () => {

    try {

      const { data } = await api.post('/api/admin/all-doctors', {}, { headers: { aToken } })
      if (data.success) {
        setDoctors(data.doctors)
        console.log(data.doctors)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }
  }

  const changeAvailability = async (docId) => {

    try {

      const { data } = await api.post('/api/admin/change-availability', { docId }, { headers: { aToken } })
      if (data.success) {
        toast.success(data.message)
        getAllDoctors()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }

  }

  const getAllAppointments = async () => {

    try {

      const { data } = await api.get('/api/admin/appointments', { headers: { aToken } })

      if (data.success) {
        setAppointments(data.appointments)
        console.log(data.appointments)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }

  }

  const cancelAppointment = async (appointmentId) => {

    try {

      const { data } = await api.post('/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

      if (data.success) {
        toast.success(data.message)
        getAllAppointments()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }

  }

  const getDashData = async () => {

    try {

      const { data } = await api.get('/api/admin/dashboard', { headers: { aToken } })

      if (data.success) {
        setDashData(data.dashData)
        console.log(data.dashData)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }

  }

  const value = {
    aToken, setAToken,
    backendUrl,
    doctors, getAllDoctors,
    changeAvailability,
    appointments, setAppointments,
    getAllAppointments,
    cancelAppointment,
    dashData, getDashData
  }

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  )
}

export default AdminContextProvider
