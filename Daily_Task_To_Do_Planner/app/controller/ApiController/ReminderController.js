const Reminder = require('../../moduals/ReminderModel');
const Task = require('../../moduals/TaskModel');
class ReminderController {
    // 1. Set Reminder for Task
    async addReminder(req, res) {
        try {
            const { taskId, type, notifyAt, repeatFrequency } = req.body;

            // Check if task belongs to user
            const task = await Task.findOne({ _id: taskId, userId: req.userId });
            if (!task) return res.status(404).json({ msg: 'Task not found' });

            const reminder = new Reminder({
                taskId,
                type,
                notifyAt,
                repeatFrequency
            });

            await reminder.save();
            res.json({ msg: 'Reminder set successfully', reminder });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // 2. Edit Reminder
    async editReminder(req, res) {
        try {
            const { reminderId } = req.params;
            const updates = req.body;

            // Ensure reminder belongs to a task owned by the user
            const reminder = await Reminder.findById(reminderId).populate('taskId');
            if (!reminder || reminder.taskId.userId.toString() !== req.userId) {
                return res.status(404).json({ msg: 'Reminder not found' });
            }

            Object.assign(reminder, updates);
            await reminder.save();

            res.json({ msg: 'Reminder updated successfully', reminder });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // 3. Delete Reminder
    async deleteReminder(req, res) {
        try {
            const { reminderId } = req.params;

            const reminder = await Reminder.findById(reminderId).populate('taskId');
            if (!reminder || reminder.taskId.userId.toString() !== req.userId) {
                return res.status(404).json({ msg: 'Reminder not found' });
            }

            await reminder.deleteOne();
            res.json({ msg: 'Reminder deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}
module.exports = new ReminderController();