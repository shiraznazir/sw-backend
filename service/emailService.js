import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Email configuration using environment variables
const emailConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
    minVersion: "TLSv1.2",
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
};

// Create reusable transporter instance
const transporter = nodemailer.createTransport(emailConfig);

function formatObjectAsHtml(obj) {
  if (!obj || typeof obj !== "object") {
    return `<p>${obj}</p>`;
  }

  // Use _doc if available (Mongoose document), otherwise use the object itself
  const data = obj._doc || obj;

  let html =
    '<table border="1" style="border-collapse: collapse; padding: 5px;">';
  html += "<tr><th>Key</th><th>Value</th></tr>";
  for (const [key, value] of Object.entries(data)) {
    const displayValue =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : value;
    html += `<tr><td>${key}</td><td>${displayValue}</td></tr>`;
  }
  html += "</table>";
  return html;
}

// Email sending function with validation and error handling
export async function sendEmail(data) {
  try {
    const textBody = `Service Walah Calls Data:\n${JSON.stringify(data, null, 2)}`;
    const htmlBody = `
      <h2>Service Walah Calls Data</h2>
      ${formatObjectAsHtml(data)}
      <p>Sent from ${process.env.APP_NAME || "Application"}</p>
    `;

    // Email options
    const mailOptions = {
      from:
        process.env.SMTP_USERNAME ||
        `"${process.env.APP_NAME || "Application"}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Service Walah Calls",
      text: textBody,
      html: htmlBody,
      headers: {
        "X-Sender": process.env.SMTP_USERNAME,
        "X-Application": process.env.APP_NAME || "MyApp",
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Export transporter
export { transporter };

// If running as standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sendEmail({ text: "Test email" })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
