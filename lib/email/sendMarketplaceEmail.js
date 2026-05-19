import nodemailer from "nodemailer";

export async function sendMarketplaceInterestEmail({
  creatorEmail,
  adminEmail,
  clientName,
  clientEmail,
  clientPhone,
  productTitle,
}) {
  try {
    if (
      !process.env.EMAIL_HOST ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    ) {
      console.warn("Email config missing");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailSubject = `New Interest in Your Marketplace Product: ${productTitle}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #007bff; margin-bottom: 20px;">New Client Interest! 🎉</h2>
          
          <p style="font-size: 16px; margin-bottom: 15px;">
            A client is interested in your marketplace product: <strong>${productTitle}</strong>
          </p>
          
          <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #007bff; margin-top: 0;">Client Details</h3>
            <p><strong>Name:</strong> ${clientName}</p>
            <p><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
            <p><strong>Phone:</strong> ${clientPhone}</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Please contact the client to discuss the product details and next steps.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send to product creator
    if (creatorEmail && creatorEmail !== adminEmail) {
      await transporter.sendMail({
        from: `${process.env.EMAIL_USER}`,
        to: creatorEmail,
        subject: emailSubject,
        html: emailHtml,
      });
    }

    // Send to admin
    await transporter.sendMail({
      from: `${process.env.EMAIL_USER}`,
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Marketplace interest emails sent successfully");
  } catch (err) {
    console.error("Marketplace email error:", err);
  }
}
