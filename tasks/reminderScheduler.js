const cron = require('node-cron');
const { Op } = require('sequelize');
const { Allocation, ActivityTracker, Facilitator, User, Module, Class } = require('../models');
const { queueReminder, queueAlert } = require('../utils/notificationDispatcher');
const { getManagerEmails } = require('../services/managerService');



function getCurrentWeekForTrimester(trimester, year) {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (year !== currentYear) {
    return -1;
  }

  let trimesterStartDate;
  switch (trimester) {
    case 'T1':
      trimesterStartDate = new Date(year, 0, 1); 
      break;
    case 'T2':
      trimesterStartDate = new Date(year, 4, 1); 
      break;
    case 'T3':
      trimesterStartDate = new Date(year, 8, 1); 
      break;
    default:
      return -1; 
  }

  const msInWeek = 1000 * 60 * 60 * 24 * 7;
  const diffInMs = now.getTime() - trimesterStartDate.getTime();
  const currentWeek = Math.floor(diffInMs / msInWeek) + 1; 
  return Math.max(1, currentWeek); 
}


async function checkAndQueueMissingLogs() {
  console.log('\n[SCHEDULER] Running check for missing activity logs...');
  const managerEmails = await getManagerEmails();

  try {
    const allocations = await Allocation.findAll({
      include: [
        { model: Facilitator, include: [{ model: User, attributes: ['email', 'name'] }] },
        { model: Module, attributes: ['name'] },
        { model: Class, attributes: ['name'] },
      ]
    });

    for (const allocation of allocations) {
      const currentWeek = getCurrentWeekForTrimester(allocation.trimester, allocation.year);

      if (currentWeek === -1) {
        console.warn(`[SCHEDULER] Skipping allocation ${allocation.id}: Could not determine current week for trimester ${allocation.trimester}, year ${allocation.year}.`);
        continue;
      }

      const MAX_WEEKS_PER_TRIMESTER = 12; 

      for (let i = 1; i <= Math.min(currentWeek, MAX_WEEKS_PER_TRIMESTER); i++) {
        const existingLog = await ActivityTracker.findOne({
          where: {
            allocationId: allocation.id,
            weekNumber: i,
          },
        });

        const isLogComplete = (log) => {
            if (!log) return false;
        
            return log.formativeOneGrading === 'Done' &&
                   log.formativeTwoGrading === 'Done' &&
                   log.summativeGrading === 'Done' &&
                   log.courseModeration === 'Done' &&
                   log.intranetSync === 'Done' &&
                   log.gradeBookStatus === 'Done';
        };

        const isPastDeadline = i < currentWeek; 

        if (!existingLog && isPastDeadline) {
          
          console.log(`  -> Missing log for Allocation ${allocation.id}, Week ${i}`);
          await queueReminder(
            allocation.Facilitator.User.email,
            allocation.Facilitator.User.name,
            i,
            allocation.Module ? allocation.Module.name : 'N/A',
            allocation.Class ? allocation.Class.name : 'N/A'
          );
          await queueAlert(managerEmails, 'deadline_missed', {
            allocationId: allocation.id,
            weekNumber: i,
            facilitatorEmail: allocation.Facilitator.User.email,
            facilitatorName: allocation.Facilitator.User.name,
            moduleName: allocation.Module ? allocation.Module.name : 'N/A',
            className: allocation.Class ? allocation.Class.name : 'N/A',
            reason: 'log_missing',
          });
        } else if (existingLog && !isLogComplete(existingLog) && isPastDeadline) {
          console.log(`  -> Incomplete log for Allocation ${allocation.id}, Week ${i}`);
          await queueReminder(
            allocation.Facilitator.User.email,
            allocation.Facilitator.User.name,
            i,
            allocation.Module ? allocation.Module.name : 'N/A',
            allocation.Class ? allocation.Class.name : 'N/A'
          );
           await queueAlert(managerEmails, 'deadline_missed', { 
            allocationId: allocation.id,
            weekNumber: i,
            facilitatorEmail: allocation.Facilitator.User.email,
            facilitatorName: allocation.Facilitator.User.name,
            moduleName: allocation.Module ? allocation.Module.name : 'N/A',
            className: allocation.Class ? allocation.Class.name : 'N/A',
            logId: existingLog.id,
            reason: 'log_incomplete',
          });
        }
      }
    }
    console.log('[SCHEDULER] Missing log check completed.');
  } catch (error) {
    console.error('[SCHEDULER] Error checking for missing logs:', error);
  }
}


exports.startSchedulers = () => {
  // Schedule to run every day at 1:00 AM CAT (0 1 * * *)
  cron.schedule('0 1 * * *', checkAndQueueMissingLogs, {
    scheduled: true,
    timezone: "Africa/Kigali" 
  });
  console.log('Activity log reminder scheduler started.');


};