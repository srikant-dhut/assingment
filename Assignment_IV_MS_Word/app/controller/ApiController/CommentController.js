const mongoose = require("mongoose");
const Comment = require("../../moduals/CommentModel");
const Post = require("../../moduals/PostModel");

class CommentController {
    async createComment(req, res) {
        try {
            const { postId, content } = req.body;

            if (!req.isAuthenticated || !req.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (!postId || !content) {
                return res.status(400).json({ error: "Post ID and content are required" });
            }

            // Check if post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            const newComment = await Comment.create({
                postId,
                content,
                authorId: req.userId,
            });

            // Get the created comment with author details using aggregation
            const commentWithAuthor = await Comment.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(newComment._id) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "authorId",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ["$author", 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        author: {
                            _id: 1,
                            name: 1,
                            profileImage: 1
                        }
                    }
                }
            ]);

            res.status(201).json(commentWithAuthor[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getCommentsByPost(req, res) {
        try {
            const { postId } = req.params;

            const comments = await Comment.aggregate([
                { $match: { postId: new mongoose.Types.ObjectId(postId) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "authorId",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ["$author", 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        author: {
                            _id: 1,
                            name: 1,
                            profileImage: 1
                        }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            res.json(comments);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async editComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;

            if (!req.isAuthenticated || !req.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (!content) {
                return res.status(400).json({ error: "Content is required" });
            }

            const result = await Comment.updateOne(
                { _id: id, authorId: req.userId },
                { content }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Comment not found or you are not the author" });
            }

            res.json({ msg: "Comment updated successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteComment(req, res) {
        try {
            const { id } = req.params;

            if (!req.isAuthenticated || !req.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const result = await Comment.deleteOne({ _id: id, authorId: req.userId });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Comment not found or you are not the author" });
            }

            res.json({ msg: "Comment deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new CommentController();
