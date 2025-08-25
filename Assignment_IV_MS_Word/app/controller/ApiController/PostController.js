const mongoose = require("mongoose");
const Category = require("../../moduals/CategoriesModel");
const Post = require("../../moduals/PostModel")

class PostController {

    async createPost(req, res) {
        try {
            const { title, content, categoryId, tags } = req.body;

            if (!req.isAuthenticated || !req.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const newPost = await Post.create({
                title,
                content,
                categoryId,
                tags,
                authorId: req.userId,
            });

            res.status(201).json(newPost);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async editPost(req, res) {
        try {
            const { id } = req.params;
            const { title, content, categoryId, tags } = req.body;

            const result = await Post.updateOne(
                { _id: id, authorId: req.userId },
                { title, content, categoryId, tags }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Post not found or you are not the author" });
            }

            res.json({ msg: "Post updated" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }


    async deletePost(req, res) {
        try {
            const { id } = req.params;
            const result = await Post.deleteOne({ _id: id, authorId: req.userId });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Post not found or you are not the author" });
            }

            res.json({ msg: "Post deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async likePost(req, res) {
        try {
            const { id } = req.params;

            if (!req.isAuthenticated || !req.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const result = await Post.updateOne(
                { _id: id },
                { $inc: { likes: 1 } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Post not found" });
            }

            res.json({ msg: "Post liked successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async unlikePost(req, res) {
        try {
            const { id } = req.params;

            if (!req.isAuthenticated || !req.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const result = await Post.updateOne(
                { _id: id },
                { $inc: { likes: -1 } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Post not found" });
            }

            res.json({ msg: "Post unliked successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getAllPosts(req, res) {
        try {
            const posts = await Post.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "authorId",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ["$author", 0] },
                        category: { $arrayElemAt: ["$category", 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        content: 1,
                        tags: 1,
                        likes: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        author: {
                            _id: 1,
                            name: 1,
                            profileImage: 1
                        },
                        category: {
                            _id: 1,
                            name: 1,
                            description: 1
                        }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);
            res.json(posts);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getPostById(req, res) {
        try {
            const { id } = req.params;
            const posts = await Post.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "authorId",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $lookup: {
                        from: "comments",
                        localField: "_id",
                        foreignField: "postId",
                        as: "comments"
                    }
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ["$author", 0] },
                        category: { $arrayElemAt: ["$category", 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        content: 1,
                        tags: 1,
                        likes: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        author: {
                            _id: 1,
                            name: 1,
                            profileImage: 1
                        },
                        category: {
                            _id: 1,
                            name: 1,
                            description: 1
                        },
                        comments: {
                            _id: 1,
                            content: 1,
                            createdAt: 1,
                            authorId: 1
                        }
                    }
                }
            ]);
            
            if (posts.length === 0) {
                return res.status(404).json({ error: "Post not found" });
            }
            
            res.json(posts[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async postsByLikes(req, res) {
        try {
            const posts = await Post.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "authorId",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ["$author", 0] },
                        category: { $arrayElemAt: ["$category", 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        content: 1,
                        tags: 1,
                        likes: 1,
                        createdAt: 1,
                        author: {
                            _id: 1,
                            name: 1,
                            profileImage: 1
                        },
                        category: {
                            _id: 1,
                            name: 1,
                            description: 1
                        }
                    }
                },
                { $sort: { likes: -1 } }
            ]);
            res.json(posts);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
module.exports = new PostController();