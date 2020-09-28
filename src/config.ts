import dotenv from 'dotenv'

dotenv.config()

const config = {
  isProduction: process.env.NODE_ENV === 'production',
  token: process.env.TOKEN,
}

export default config
