import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type SessionData = {
  userId?: number
  email?: string
}

const fallbackPassword = 'insecure_dev_password_change_me_please_1234567890'

export const sessionOptions = {
  password: (process.env.IRON_SESSION_PASSWORD as string) || fallbackPassword,
  cookieName: 'photographer_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export async function getServerSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}


