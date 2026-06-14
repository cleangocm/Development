
import nodemailer from "nodemailer";
import Settings from "../model/settings.model.js";

const getSmtpConfig = async () => {
  try {
    const settingsDoc = await Settings.findOne({ key: "smtpConfig" });
    const smtp = settingsDoc?.value || {};
    return {
      host: smtp.host || process.env.SMTP_HOST || '',
      port: parseInt(smtp.port || process.env.SMTP_PORT || '587', 10),
      user: smtp.user || process.env.BREVO_SMTP_USER || '',
      pass: smtp.password || process.env.BREVO_SMTP_KEY || '',
      from: smtp.from || process.env.EMAIL_FROM || 'noreply@ultrawash.com',
    };
  } catch {
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.BREVO_SMTP_USER || '',
      pass: process.env.BREVO_SMTP_KEY || '',
      from: process.env.EMAIL_FROM || 'noreply@ultrawash.com',
    };
  }
};

export const EmailSend = async (emailTo, emailText, emailSubject) => {
  try {
    const { host, port, user, pass, from } = await getSmtpConfig();

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = { from, to: emailTo, subject: emailSubject, text: emailText };

    const result = await transport.sendMail(mailOptions);
    console.log("📧 Email sent successfully to:", emailTo);
    return result;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw error;
  }
};

