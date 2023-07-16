import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental // will be removed in future
} = NextAuth({
  providers: [GitHub],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.picture
      }
      return token
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    },
    // Prevent anyone besides the admin (find your github id at https://api.github.com/users/<your_github_user_name>) from signing up
    /*async signIn({ profile, account, user }) {
      // console.log('signIn', { profile, account, user })
      if (account?.providerAccountId === '17400831') {
        return true
      }
      return false
    }*/
  },
  pages: {
    signIn: '/sign-in', // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
    error: '/error' // if there is an error, redirect to the sign in page
  }
})
