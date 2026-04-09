import { createContext, useEffect, useState } from "react";
import { toast } from 'react-toastify'
import { api, apiBaseUrl, getApiErrorMessage } from '../lib/api'

export const AppContext = createContext();

const AppContextProvider = (props) => {

  const currencySymbol = '$'
  const backendUrl = apiBaseUrl

  const [doctors, setDoctors] = useState([])
  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)
  const [userData, setUserData] = useState(false)

  const getDoctorsData = async () => {

    try {

      const { data } = await api.get('/api/doctor/list')
      if (data.success) {
        setDoctors(data.doctors)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }

  }

  const loadUserProfileData = async () => {

    try {

      const { data } = await api.get('/api/user/get-profile', { headers: { token } })

      if (data.success) {
        setUserData(data.userData)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error('FULL ERROR:', error)
      toast.error(getApiErrorMessage(error))
    }

  }

  const value = {
    doctors, getDoctorsData,
    currencySymbol,
    token, setToken,
    backendUrl,
    userData, setUserData,
    loadUserProfileData
  }

  useEffect(() => {
    getDoctorsData()
  }, [])

  useEffect(() => {
    if (token) {
      loadUserProfileData()
    } else {
      setUserData(false)
    }
  }, [token])

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  )

}

export default AppContextProvider
