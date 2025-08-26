const dotenv = require('dotenv')
dotenv.config()
const nodemailer = require("nodemailer");

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationLink) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - Institute Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to Institute Management System</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Institute Management System Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetLink) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Institute Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Institute Management System Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

// Send student performance report email
const sendStudentReportEmail = async (email, studentName, reportData) => {
  try {
    const transporter = createTransporter();

    // Generate HTML table for the report
    const generateReportTable = (report) => {
      let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Metric</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Value</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Add overall performance metrics
      tableHTML += `
        <tr>
          <td style="border: 1px solid #dee2e6; padding: 12px;"><strong>Overall Attendance</strong></td>
          <td style="border: 1px solid #dee2e6; padding: 12px;">${report.overall.overallAttendance}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dee2e6; padding: 12px;"><strong>Overall Exam Score</strong></td>
          <td style="border: 1px solid #dee2e6; padding: 12px;">${report.overall.overallExamScore}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dee2e6; padding: 12px;"><strong>Exam Pass Rate</strong></td>
          <td style="border: 1px solid #dee2e6; padding: 12px;">${report.overall.examPassRate}</td>
        </tr>
      `;

      // Add course-wise performance
      if (report.courses && report.courses.length > 0) {
        tableHTML += `
          <tr style="background-color: #f8f9fa;">
            <td colspan="2" style="border: 1px solid #dee2e6; padding: 12px;"><strong>Course Performance</strong></td>
          </tr>
        `;

        report.courses.forEach(course => {
          tableHTML += `
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">${course.courseName}</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">
                Attendance: ${course.attendance.percentage} | 
                Exams: ${course.exams.totalExams} | 
                Grade: ${course.grade || 'N/A'}
              </td>
            </tr>
          `;
        });
      }

      tableHTML += `
          </tbody>
        </table>
      `;

      return tableHTML;
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Performance Report - ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Student Performance Report</h2>
          <p>Hello ${studentName},</p>
          <p>Please find your performance report below:</p>
          
          ${generateReportTable(reportData)}
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Summary</h3>
            <p><strong>Overall Performance:</strong> ${reportData.summary.overallPerformance}%</p>
            <p><strong>Recommendation:</strong> ${reportData.summary.recommendation}</p>
          </div>
          
          <p>If you have any questions about this report, please contact your teachers or administrators.</p>
          <br>
          <p>Best regards,<br>Institute Management System Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Student report email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending student report email:", error);
    return false;
  }
};

// Send general notification email
const sendNotificationEmail = async (email, name, subject, message) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">${subject}</h2>
          <p>Hello ${name},</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            ${message}
          </div>
          <br>
          <p>Best regards,<br>Institute Management System Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Notification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending notification email:", error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendStudentReportEmail,
  sendNotificationEmail,
};