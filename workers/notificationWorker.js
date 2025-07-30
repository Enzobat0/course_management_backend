const notificationQueue = require('../queues/notificationQueue');
const transporter = require('../config/nodemailer');

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@example.com';

// --- Process 'reminder' jobs ---
notificationQueue.process('reminder', async (job) => {
  const { toEmail, facilitatorName, weekNumber, moduleName, className, message } = job.data;
  console.log(`\n[REMINDER WORKER] Processing Reminder Job ${job.id}:`);
  console.log(`  To: ${toEmail}`);
  console.log(`  Message: ${message}`);

  try {
    await transporter.sendMail({
      from: `"Course Management System" <${SENDER_EMAIL}>`,
      to: toEmail,
      subject: `Reminder: Activity Log for Week ${weekNumber} of ${moduleName}`,
      html: `
        <p>Dear ${facilitatorName},</p>
        <p>This is a reminder regarding your activity log:</p>
        <p><strong>Message:</strong> ${message}</p>
        <p>Please ensure you complete or update it soon.</p>
        <p>Thank you.</p>
        <p>Course Management System Team</p>
      `,
    });
    console.log(`[REMINDER WORKER] Successfully sent email reminder to ${toEmail}.`);
  } catch (error) {
    console.error(`[REMINDER WORKER] Failed to send email reminder to ${toEmail}:`, error.message);
    throw new Error(`Email sending failed for reminder job ${job.id}: ${error.message}`);
  }
});

// --- Process 'alert' jobs ---
notificationQueue.process('alert', async (job) => {
  const { to: managerEmails, alertType, data, message } = job.data;
  console.log(`\n[ALERT WORKER] Processing Alert Job ${job.id} (Type: ${alertType}):`);
  console.log(`  To Managers: ${managerEmails.join(', ')}`);
  console.log(`  Raw Message: ${message}`);
  console.log(`  Alert Data:`, data);


  const defaultSubject = `Manager Alert: Activity Log Notification - ${alertType.replace(/_/g, ' ').toUpperCase()}`;
  const defaultHtml = `
    <p>Dear Manager,</p>
    <p>You have a new alert regarding activity logs:</p>
    <p><strong>Alert Type:</strong> ${alertType.replace(/_/g, ' ')}</p>
    <p><strong>Message:</strong> ${message}</p>
    <p><strong>Details:</strong> ${JSON.stringify(data, null, 2).replace(/\n/g, '<br>')}</p>
    <p>Please log in to the system for more details.</p>
    <p>Course Management System Team</p>
  `;

  try {
    await transporter.sendMail({
      from: `"CMS Alert System" <${SENDER_EMAIL}>`,
      to: managerEmails.join(','),
      subject: defaultSubject,
      html: defaultHtml,
    });
    console.log(`[ALERT WORKER] Successfully sent alert email to managers: ${managerEmails.join(', ')}.`);
  } catch (error) {
    console.error(`[ALERT WORKER] Failed to send alert email to managers ${managerEmails.join(', ')}:`, error.message);
    throw new Error(`Email sending failed for alert job ${job.id}: ${error.message}`);
  }
});

console.log('Notification worker started. Listening for jobs...');