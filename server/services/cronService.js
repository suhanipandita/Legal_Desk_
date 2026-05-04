const cron = require('node-cron');
const { getDB } = require('../config/db');
const { sendReminderEmail } = require('./emailService');

/**
 * Start the automated reminder engine
 * Runs daily at 08:00 IST - checks upcoming hearings and deadlines
 */
function startReminderCron() {
  // Run every day at 08:00 IST (02:30 UTC)
  cron.schedule('30 2 * * *', async () => {
    console.log('🔔 Running daily reminder check...');

    try {
      const db = getDB();
      const now = new Date();
      const reminderDays = [1, 3, 7];

      for (const days of reminderDays) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // Find cases with hearings on the target date
        const cases = await db
          .collection('cases')
          .aggregate([
            {
              $match: {
                $or: [
                  { nextHearingDate: { $gte: startOfDay, $lte: endOfDay } },
                  { filingDeadline: { $gte: startOfDay, $lte: endOfDay } },
                ],
                status: { $nin: ['closed', 'completed'] },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'lawyer',
                foreignField: '_id',
                as: 'lawyerInfo',
              },
            },
            { $unwind: '$lawyerInfo' },
          ])
          .toArray();

        for (const c of cases) {
          const dateToRemind = c.nextHearingDate || c.filingDeadline;
          const subject = `⚠️ ${days}-Day Reminder: ${c.title}`;

          await sendReminderEmail(
            c.lawyerInfo.email,
            subject,
            c.title,
            dateToRemind,
            c.courtName,
            c._id
          );
        }

        if (cases.length > 0) {
          console.log(`📧 Sent ${cases.length} reminders for ${days}-day deadline`);
        }
      }
    } catch (error) {
      console.error('Reminder cron error:', error.message);
    }
  });

  console.log('⏰ Reminder cron job scheduled (daily 08:00 IST)');
}

module.exports = { startReminderCron };
