import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    phone?: string
  }
  interface Session {
    user: {
      role?: string
      id?: string
      phone?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    id?: string
    phone?: string
  }
}
