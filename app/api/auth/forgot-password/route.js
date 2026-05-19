import crypto from "crypto";
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
    console.log("🔥 Forgot Password API HIT");
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

 
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}