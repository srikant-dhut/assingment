const mongoose = require("mongoose");
const Category = require("../../moduals/CategoriesModel");
const Post = require("../../moduals/PostModel")

class CategoriesController {

  async addCategory(req, res) {
    try {
      const { name, description } = req.body;
      await Category.create({ name, description });
      res.json({ msg: "Category added" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listCategoriesWithPosts(req, res) {
    try {
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "categoryId",
            as: "posts"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "posts.authorId",
            foreignField: "_id",
            as: "postAuthors"
          }
        },
        {
          $addFields: {
            totalPosts: { $size: "$posts" },
            posts: {
              $map: {
                input: "$posts",
                as: "post",
                in: {
                  _id: "$$post._id",
                  title: "$$post.title",
                  content: "$$post.content",
                  tags: "$$post.tags",
                  likes: "$$post.likes",
                  createdAt: "$$post.createdAt",
                  author: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$postAuthors",
                          as: "author",
                          cond: { $eq: ["$$author._id", "$$post.authorId"] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            totalPosts: 1,
            posts: 1
          }
        }
      ]);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CategoriesController();
