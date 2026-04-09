export const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} missing`)
  }

  return value
}

export const validateRequiredEnv = (names) => {
  const missing = names.filter((name) => !process.env[name]?.trim())

  if (missing.length === 0) {
    return
  }

  missing.forEach((name) => {
    console.error(`FATAL ERROR: ${name} is not defined`)
  })

  process.exit(1)
}
