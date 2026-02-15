import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Providers.Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    Providers.Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement your logic here to find the user
        const user = await prisma.user.findUnique({ where: { username: credentials.username } });
        if (user && user.password === credentials.password) {
          return user;
        }
        return null;
      }
    }),
  ],
  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Add user role to the token
      }
      return token;
    },
    async session(session, token) {
      session.user.id = token.id;
      session.user.role = token.role; // Add role to session
      return session;
    },
  },
  session: {
    strategy: "database", // Use database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',  // Custom sign-in page
    error: '/auth/error', // Error page
    // ... You can add more pages here
  },
  events: {
    async signIn(message) {
      // Used to log sign-in events
      console.log('User signed in:', message);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});