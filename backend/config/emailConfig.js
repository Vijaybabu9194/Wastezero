const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name, purpose = 'verification') => {
  try {
    const transporter = createTransporter();
    
    const subject = purpose === 'login' 
      ? 'WasteZero - Login Verification Code' 
      : 'WasteZero - Email Verification Code';
    
    const message = purpose === 'login'
      ? `You are attempting to log in to your WasteZero account.`
      : `Thank you for registering with WasteZero!`;
    
    const mailOptions = {
      from: `"WasteZero" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border: 2px dashed #10b981;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #059669;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .info {
              background: #f9fafb;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .emoji {
              font-size: 40px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span>♻️</span> WasteZero</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>${message}</p>
              <p>Your verification code is:</p>
              
              <div class="otp-box">
                <div class="emoji">🔐</div>
                <div class="otp-code">${otp}</div>
                <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
                  This code will expire in 10 minutes
                </p>
              </div>
              
              <div class="info">
                <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Never share this code with anyone</li>
                  <li>WasteZero will never ask for your code</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; margin-top: 30px;">
                If you have any questions, feel free to contact our support team.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">
                <strong>Join the movement for a cleaner tomorrow 🌍</strong>
              </p>
              <p style="margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} WasteZero. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, message: 'Failed to send OTP email' };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};
