const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const QuationsControllers = require("../../controller/ApiController/QuationsController");

router.get("/category/:id", QuationsControllers.listByCategory);
router.post("/submit", authMiddleware, QuationsControllers.submitAnswer);
router.post("/quationsadd", authMiddleware, QuationsControllers.addQuestion);
router.get("/search", QuationsControllers.searchQuestionWithAnswers);

module.exports = router;
