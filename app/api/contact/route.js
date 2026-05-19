import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, countryCode, contact, service, requirement } = body;

    // -------------------------------
    // Validation
    // -------------------------------
    if (!name || !email || !countryCode || !contact || !service || !requirement) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Contact number validation
    if (!/^\d{10}$/.test(contact)) {
      return new Response(
        JSON.stringify({ error: "Contact number must be exactly 10 digits" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Country Code validation
    if (!countryCode.startsWith("+")) {
      return new Response(
        JSON.stringify({ error: "Invalid country code" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // -------------------------------
    // Environment Variables
    // -------------------------------
    const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, CONTACT_EMAIL_TO } = process.env;
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS || !CONTACT_EMAIL_TO) {
      console.error("Missing email environment variables");
      return new Response(
        JSON.stringify({ error: "Server email configuration missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // -------------------------------
    // Nodemailer Transport
    // -------------------------------
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: 465,
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    // -------------------------------
    // Email Template
    // -------------------------------
    const mailOptions = {
      from: `"Contact Form" <${EMAIL_USER}>`,
      to: CONTACT_EMAIL_TO,
      replyTo: email,
      subject: `New Inquiry: ${service} – ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#333; max-width:600px;">
          <h2 style="color:#0ebac7;">🚀 New Contact Form Submission</h2>
          <hr style="border:1px solid #eee; margin:20px 0;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${countryCode} ${contact}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Requirement:</strong></p>
          <blockquote style="background:#f9f9f9; padding:12px; border-left:4px solid #0ebac7; margin:16px 0;">
            ${requirement.replace(/\n/g, "<br>")}
          </blockquote>
          <hr style="border:1px solid #eee; margin:20px 0;" />
          <small style="color:#777;">Sent via website contact form</small>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${countryCode} ${contact}
Service: ${service}
Requirement: ${requirement}

Sent via website contact form
      `.trim(),
    };

    // -------------------------------
    // Send Email
    // -------------------------------
    await transporter.sendMail(mailOptions);

    await connectToDatabase();
    const adminIds = (await User.find({ role: "admin" }).select("_id")).map((user) => user._id?.toString?.() || user._id).filter(Boolean);

    if (adminIds.length) {
      await notificationService.createAndEmitNotification({
        userIds: adminIds,
        type: "request",
        title: "New project request",
        message: `${name} requested ${service} via the contact form.`,
        text: `${name} requested ${service} via the contact form.`,
        source: "contact",
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Mail sent successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Mail Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Unknown error",
        message: "Failed to send email.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
