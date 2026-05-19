// import nodemailer from "nodemailer";

// export async function sendTicketEmail({ to, subject, html }) {
//   try {
//     if (
//       !process.env.EMAIL_HOST ||
//       !process.env.EMAIL_USER ||
//       !process.env.EMAIL_PASS
//     ) {
//       console.warn("Email config missing");
//       return;
//     }

//     const transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: Number(process.env.EMAIL_PORT) || 465,
//       secure: true,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"CyberSpace Support" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//   } catch (err) {
//     console.error("Email error:", err);
//   }
// }
import nodemailer from "nodemailer";

export async function sendTicketEmail({ to, subject, html }) {
  try {
    const missing = [
      !process.env.EMAIL_HOST && "EMAIL_HOST",
      !process.env.EMAIL_USER && "EMAIL_USER",
      !process.env.EMAIL_PASS && "EMAIL_PASS",
    ].filter(Boolean)

    if (missing.length > 0) {
      const message = `Email config missing: ${missing.join(", ")}`
      console.error(message)
      throw new Error(message)
    }

    const port = Number(process.env.EMAIL_PORT) || 465
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `${process.env.EMAIL_USER}`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendTicketEmail error:", err);
    throw err;
  }
}