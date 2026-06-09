import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid credentials or account disabled");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        const sessionToken = crypto.randomUUID();
        
        if (user.role === "OFFICE") {
          await prisma.user.update({
            where: { id: user.id },
            data: { currentToken: sessionToken },
          });
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          allowedIps: user.allowedIps,
          officeId: user.officeId,
          sessionToken: user.role === "OFFICE" ? sessionToken : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.allowedIps = user.allowedIps;
        token.officeId = user.officeId;
        token.sessionToken = (user as any).sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          role: token.role as string,
          allowedIps: token.allowedIps as string | null,
          officeId: token.officeId as string | null,
          sessionToken: token.sessionToken as string | null,
        } as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-key-for-development-only",
};
