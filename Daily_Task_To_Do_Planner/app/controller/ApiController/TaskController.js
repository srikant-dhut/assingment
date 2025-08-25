const mongoose = require("mongoose");
const Task = require("../../moduals/TaskModel");
//const Post = require("../../moduals/PostModel")

class TaskController {



    // 1. Add Task
    async addTask(req, res) {
        try {
            const { title, description, priority, dueDate, categoryId, labelIds } = req.body;

            const task = new Task({
                userId: req.userId,
                title,
                description,
                priority,
                dueDate,
                categoryId: categoryId || null,
                labelIds: labelIds || [],
            });

            await task.save();
            res.json({ msg: 'Task created successfully', task });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 2. Edit Task
    async editTask(req, res) {
        try {
            const { taskId } = req.params;
            const updates = req.body;

            const task = await Task.findOneAndUpdate(
                { _id: taskId, userId: req.userId },
                { $set: updates },
                { new: true }
            );

            if (!task) return res.status(404).json({ msg: 'Task not found' });

            res.json({ msg: 'Task updated successfully', task });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 3. Delete Task
    async deleteTask(req, res) {
        try {
            const { taskId } = req.params;

            const task = await Task.findOneAndDelete({ _id: taskId, userId: req.userId });
            if (!task) return res.status(404).json({ msg: 'Task not found' });

            res.json({ msg: 'Task deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 4. Mark Task as Completed
    async markCompleted(req, res) {
        try {
            const { taskId } = req.params;

            const task = await Task.findOneAndUpdate(
                { _id: taskId, userId: req.userId },
                { $set: { status: 'Completed' } },
                { new: true }
            );

            if (!task) return res.status(404).json({ msg: 'Task not found' });

            res.json({ msg: 'Task marked as completed', task });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 5. List Tasks with Filters
    async listTasks(req, res) {
        try {
            const { dueDate, status, categoryId, labelIds } = req.query;
            const filter = { userId: req.userId };

            // Filter by status
            if (status) filter.status = status;

            // Filter by category
            if (categoryId) filter.categoryId = categoryId;

            // Filter by labels (all labels must match)
            if (labelIds) filter.labelIds = { $all: labelIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };

            // Filter by dueDate
            if (dueDate === 'today') {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setHours(23, 59, 59, 999);
                filter.dueDate = { $gte: start, $lte: end };
            }
            else if (dueDate === 'tomorrow') {
                const start = new Date();
                start.setDate(start.getDate() + 1);
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setDate(end.getDate() + 1);
                end.setHours(23, 59, 59, 999);
                filter.dueDate = { $gte: start, $lte: end };
            }
            else if (dueDate === 'week') {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setDate(end.getDate() + 7);
                end.setHours(23, 59, 59, 999);
                filter.dueDate = { $gte: start, $lte: end };
            }

            const tasks = await Task.find(filter).sort({ order: 1, dueDate: 1 });
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // 6. Reorder Tasks
    async reorderTasks(req, res) {
        try {
            const { orderedTaskIds } = req.body;

            if (!Array.isArray(orderedTaskIds)) {
                return res.status(400).json({ msg: 'orderedTaskIds must be an array' });
            }

            // Bulk update task orders
            const bulkOps = orderedTaskIds.map((taskId, index) => ({
                updateOne: {
                    filter: { _id: taskId, userId: req.userId },
                    update: { $set: { order: index } }
                }
            }));

            await Task.bulkWrite(bulkOps);

            res.json({ msg: 'Tasks reordered successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
module.exports = new TaskController();