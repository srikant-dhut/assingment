const mongoose = require("mongoose");
const Category = require("../../moduals/CategoriesModel");

class CategoriesController {

  // 1. Add Category
  async addCategory(req, res) {
    try {
      const { name, description } = req.body;

      const category = new Category({
        userId: req.userId,
        name,
        description
      });

      await category.save();
      res.json({ msg: 'Category created successfully', category });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 2. Edit Category
  async editCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const updates = req.body;

      const category = await Category.findOneAndUpdate(
        { _id: categoryId, userId: req.userId },
        { $set: updates },
        { new: true }
      );

      if (!category) return res.status(404).json({ msg: 'Category not found' });

      res.json({ msg: 'Category updated successfully', category });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // 3. Delete Category
  async deleteCategory(req, res) {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ msg: 'Category ID is required' });
    }

    const category = await Category.findOneAndDelete({
      _id: categoryId,
      userId: req.userId // ensures user can only delete their own categories
    });

    if (!category) {
      return res.status(404).json({ msg: 'Category not found or not yours' });
    }

    res.json({ msg: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

  // 4. List Categories for a User
  async listCategories(req, res) {
    try {
      const categories = await Category.find({ userId: req.userId }).sort({ name: 1 });
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

}

module.exports = new CategoriesController();
