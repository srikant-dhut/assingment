const Category = require("../../moduals/CategoriesModel");

class CategoriesController {

  async addCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const category = new Category({ name });
      await category.save();

      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  
  async listWithQuestionCount(req, res) {
    try {
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "categories",
            as: "questions"
          }
        },
        {
          $project: {
            name: 1,
            totalQuestions: { $size: "$questions" }
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
