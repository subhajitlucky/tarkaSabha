import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent select_account",
          access_type: "offline",
          response_type: "code",
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach user ID to session for easy access
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    // Add signIn callback to allow any Google account
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        // Safety check: Prevent linking a Google account to a user with a different email
        // This happens if a session persists and the user tries to sign in with a different Google account
        if (user.email && user.email !== profile.email) {
          return false
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
})
