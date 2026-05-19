import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const email = parsed.data.email.trim().toLowerCase();
          const password = parsed.data.password;

          await connectToDatabase();

          let user = await User.findOne({ email });

          // ⭐ Bootstrap admin
          if (!user) {
            const adminCount = await User.countDocuments({ role: "admin" });

            const canBootstrap =
              adminCount === 0 &&
              email === (process.env.ADMIN_EMAIL || "").toLowerCase() &&
              password === process.env.ADMIN_PASSWORD;

            if (canBootstrap) {
              const passwordHash = await bcrypt.hash(password, 12);

              user = await User.create({
                name: process.env.ADMIN_NAME || "Admin",
                email,
                passwordHash,
                role: "admin",
                isActive: true,
              });
            }
          }

          if (!user || !user.isActive) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          // ✅ RETURN CLEAN USER OBJECT
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };

        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // 🔐 JWT CALLBACK
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    // 🔐 SESSION CALLBACK (VERY IMPORTANT)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;       // ⭐ REQUIRED
        session.user.role = token.role;   // ⭐ REQUIRED
        session.user.email = token.email;
        session.user.name = token.name;
      }

      return session;
    },
  },

  // ⭐ DEBUG MODE (ONLY DEV)
  debug: process.env.NODE_ENV === "development",
};