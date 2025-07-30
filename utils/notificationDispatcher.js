const notificationQueue = require('../queues/notificationQueue');

exports.queueReminder = async (toEmail, facilitatorName, weekNumber, moduleName, className) => {
  await notificationQueue.add('reminder', {
    toEmail,
    facilitatorName,
    weekNumber,
    moduleName,
    className,
    message: `Reminder: You have not submitted or completed your activity log for Module: ${moduleName}, Class: ${className}, Week ${weekNumber}. Please submit it as soon as possible.`,
  }, {
    
    jobId: `reminder-${toEmail}-${moduleName}-${className}-${weekNumber}`, // Unique ID for idempotency
    removeOnComplete: true, // Remove job from queue when completed
    removeOnFail: false, // Keep failed jobs for inspection
  });
  console.log(`Queued reminder for ${facilitatorName} (Week ${weekNumber})`);
};


exports.queueAlert = async (managerEmails, alertType, data) => {
  if (!Array.isArray(managerEmails) || managerEmails.length === 0) {
    console.warn(`No manager emails provided for alert type '${alertType}'. Alert not queued.`);
    return;
  }

  await notificationQueue.add('alert', {
    to: managerEmails, // Array of manager emails
    alertType,
    data,
    message: `Manager Alert: ${alertType} event for log ID ${data.logId || 'N/A'}. Details: ${JSON.stringify(data)}.`,
  }, {
    removeOnComplete: true,
    removeOnFail: false,
  });
  console.log(`Queued manager alert of type '${alertType}'`);
};