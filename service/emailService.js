import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Email configuration using environment variables
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    minVersion: 'TLSv1.2'
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100
};

// Create reusable transporter instance
const transporter = nodemailer.createTransport(emailConfig);

// Function to format object as HTML table
function formatObjectAsHtml(obj) {
  let html = '<table border="1" style="border-collapse: collapse; padding: 5px;">';
  html += '<tr><th>Key</th><th>Value</th></tr>';
  for (const [key, value] of Object.entries(obj)) {
    html += `<tr><td>${key}</td><td>${value}</td></tr>`;
  }
  html += '</table>';
  return html;
}

// Email sending function with validation and error handling
export async function sendEmail(data) {
  try {

    // Verify SMTP connection before sending
    await transporter.verify();

    const textBody = `Service Walah Calls Data:\n${JSON.stringify(data, null, 2)}`;
    const htmlBody = `
      <h2>Service Walah Calls Data</h2>
      ${formatObjectAsHtml(data)}
      <p>Sent from ${process.env.APP_NAME || 'Application'}</p>
    `;

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USERNAME || `"${process.env.APP_NAME || 'Application'}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Service Walah Calls",
      text: textBody,
      html: htmlBody,
      headers: {
        'X-Sender': process.env.SMTP_USERNAME,
        'X-Application': process.env.APP_NAME || 'MyApp'
      }
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Export transporter
export { transporter };

// If running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  sendEmail({ text: 'Test email' })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}