import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          // You could automatically create a user here if you wanted simple onboarding
          // But let's build a separate register route instead or create on the fly.
          // For now, let's create on the fly for ease of use in demo!
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await User.create({
            name: credentials.email.split("@")[0],
            email: credentials.email,
            password: hashedPassword,
          });
          return { id: newUser._id.toString(), email: newUser.email, name: newUser.name };
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password!);
        if (!isMatch) return null;

        return { id: user._id.toString(), email: user.email, name: user.name };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET || "changeme1234567890!@#",
};