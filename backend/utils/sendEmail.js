const nodemailer = require("nodemailer");

// =========================================================
// EMAIL CONFIGURATION CHECK
// =========================================================

if (
  !process.env.EMAIL_USER ||
  !process.env.EMAIL_PASSWORD
) {
  console.warn(
    "⚠️ EMAIL_USER or EMAIL_PASSWORD is missing in .env"
  );
}

// =========================================================
// CREATE GMAIL TRANSPORTER
// =========================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// =========================================================
// VERIFY SMTP CONNECTION
// =========================================================

const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();

    console.log(
      "✅ Email transporter is ready"
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Email transporter verification failed"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Response:",
      error.response
    );

    return false;
  }
};

// Run SMTP verification when backend starts
verifyEmailTransporter();

// =========================================================
// SEND EMAIL
// =========================================================

const sendEmail = async (
  to,
  subject,
  html
) => {
  try {
    // Check environment variables
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASSWORD
    ) {
      throw new Error(
        "EMAIL_USER or EMAIL_PASSWORD is missing in .env"
      );
    }

    // Validate recipient
    if (!to) {
      throw new Error(
        "Recipient email address is required"
      );
    }

    const mailOptions = {
      from: `"SNICT" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      "================================"
    );

    console.log(
      "✅ EMAIL SENT SUCCESSFULLY"
    );

    console.log(
      "To:",
      to
    );

    console.log(
      "Subject:",
      subject
    );

    console.log(
      "Message ID:",
      info.messageId
    );

    console.log(
      "================================"
    );

    return info;

  } catch (error) {

    console.error(
      "================================"
    );

    console.error(
      "❌ EMAIL SENDING FAILED"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Command:",
      error.command
    );

    console.error(
      "Response:",
      error.response
    );

    console.error(
      "Response Code:",
      error.responseCode
    );

    console.error(
      "================================"
    );

    throw error;
  }
};

module.exports = sendEmail;