import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      name: string
      username: string
      officeId?: string | null
      allowedIps?: string[] | string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role: string
    username: string
    allowedIps?: string[] | string | null
    officeId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    allowedIps?: string[] | string | null
    officeId?: string | null
  }
}
