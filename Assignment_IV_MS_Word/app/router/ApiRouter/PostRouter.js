const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const CategoriesController = require("../../controller/ApiController/CategoriesController");
const PostController = require("../../controller/ApiController/PostController");



router.post("/createPost", authMiddleware, PostController.createPost);
router.get("/getAllPosts", PostController.getAllPosts);
router.get("/getPostById/:id", PostController.getPostById);
router.put("/editPost/:id", authMiddleware, PostController.editPost);
router.delete("/deletePost/:id", authMiddleware, PostController.deletePost);
router.post("/like/:id", authMiddleware, PostController.likePost);
router.post("/unlike/:id", authMiddleware, PostController.unlikePost);
router.get("/sorted/likes", PostController.postsByLikes);

module.exports = router;
