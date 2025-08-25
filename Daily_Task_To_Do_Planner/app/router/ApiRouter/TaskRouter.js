const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const TaskController = require("../../controller/ApiController/TaskController");



router.post('/addTask', authMiddleware, TaskController.addTask);
router.put('/editTask/:id', authMiddleware, TaskController.editTask);
router.delete('/deleteTask/:id', authMiddleware, TaskController.deleteTask);
router.patch('/markCompletedTask/:id', authMiddleware, TaskController.markCompleted);
router.get('/listTasks', authMiddleware, TaskController.listTasks);
router.patch('/reorderTasks', authMiddleware, TaskController.reorderTasks);

module.exports = router;
