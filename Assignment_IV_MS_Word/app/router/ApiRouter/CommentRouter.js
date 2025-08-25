const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const CommentController = require("../../controller/ApiController/CommentController");

router.post("/createComment", authMiddleware, CommentController.createComment);
router.get("/getCommentsByPost/:postId", CommentController.getCommentsByPost);
router.put("/editComment/:id", authMiddleware, CommentController.editComment);
router.delete("/deleteComment/:id", authMiddleware, CommentController.deleteComment);

module.exports = router;
