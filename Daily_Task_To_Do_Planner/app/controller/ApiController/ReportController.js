const Task = require('../../moduals/TaskModel');
const nodemailer = require('nodemailer');
const moment = require('moment');

class ReportController {
    // 1. Task Summary for a Day or Week
    async getTaskSummary(req, res) {
        try {
            const { date, range } = req.query; 

            let startDate, endDate;
            if (range === 'week') {
                startDate = moment(date).startOf('week').toDate();
                endDate = moment(date).endOf('week').toDate();
            } else {
                startDate = moment(date).startOf('day').toDate();
                endDate = moment(date).endOf('day').toDate();
            }

            const tasks = await Task.find({
                userId: req.userId,
                dueDate: { $gte: startDate, $lte: endDate }
            });

            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'Completed').length;
            const pending = total - completed;

            res.json({ total, completed, pending, tasks });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 2. Task Statistics
    async getTaskStatistics(req, res) {
        try {
            const tasks = await Task.find({ userId: req.userId });

            if (tasks.length === 0) return res.json({ completionRate: 0, avgCompletionTime: null });

            const completedTasks = tasks.filter(t => t.status === 'Completed');
            const completionRate = ((completedTasks.length / tasks.length) * 100).toFixed(2);

            let totalCompletionTime = 0;
            let completedCount = 0;

            completedTasks.forEach(task => {
                if (task.completedAt && task.createdAt) {
                    const diff = moment(task.completedAt).diff(moment(task.createdAt), 'hours');
                    totalCompletionTime += diff;
                    completedCount++;
                }
            });

            const avgCompletionTime = completedCount > 0 ? (totalCompletionTime / completedCount).toFixed(2) : null;

            res.json({ completionRate, avgCompletionTime });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 3. Send Daily/Weekly Task Summary to Email
    async sendTaskSummaryEmail(req, res) {
        try {
            const { emailType } = req.body; // 'daily' or 'weekly'
            const userEmail = req.user.email;

            let startDate, endDate;
            if (emailType === 'weekly') {
                startDate = moment().startOf('week').toDate();
                endDate = moment().endOf('week').toDate();
            } else {
                startDate = moment().startOf('day').toDate();
                endDate = moment().endOf('day').toDate();
            }

            const tasks = await Task.find({
                userId: req.userId,
                dueDate: { $gte: startDate, $lte: endDate }
            });

            const overdue = tasks.filter(t => t.dueDate < new Date() && t.status !== 'Completed');
            const upcoming = tasks.filter(t => t.dueDate >= new Date() && t.status !== 'Completed');
            const completed = tasks.filter(t => t.status === 'Completed');

            // Email content
            const summaryHtml = `
      <h3>${emailType.toUpperCase()} Task Summary</h3>
      <p><strong>Overdue Tasks:</strong> ${overdue.length}</p>
      <p><strong>Upcoming Tasks:</strong> ${upcoming.length}</p>
      <p><strong>Completed Tasks:</strong> ${completed.length}</p>
    `;

            // Configure email transport (dummy SMTP for testing)
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Change to your email provider
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `${emailType.toUpperCase()} Task Summary`,
                html: summaryHtml
            });

            res.json({ msg: `${emailType} summary email sent successfully` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

}
module.exports = new ReportController();