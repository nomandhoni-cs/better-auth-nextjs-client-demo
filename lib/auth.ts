import { createAuthClient } from 'better-auth/react' // make sure to import from better-auth/react
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/auth', // The base URL of the API
  plugins: [jwtClient()],
})

export const { signIn, signUp, useSession, sendVerificationEmail, signOut, verifyEmail } = authClient
