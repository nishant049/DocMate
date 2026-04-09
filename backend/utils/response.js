export const sendSuccess = (res, statusCode, message, data, extra = {}) => {
  const payload = {
    success: true,
    message,
    ...extra
  }

  if (data !== undefined) {
    payload.data = data
  }

  return res.status(statusCode).json(payload)
}

export const sendError = (res, statusCode, message, extra = {}) => res.status(statusCode).json({
  success: false,
  message,
  ...extra
})

export const handleControllerError = (
  res,
  error,
  {
    duplicateKeyMessage = 'Duplicate value',
    fallbackMessage = 'Internal server error'
  } = {}
) => {
  console.error('FULL ERROR:', error)

  if (error?.code === 11000) {
    return sendError(res, 400, duplicateKeyMessage)
  }

  return sendError(res, 500, fallbackMessage)
}
