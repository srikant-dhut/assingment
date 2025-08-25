const Category = require("../../moduals/CategoriesModel");
const Product = require("../../moduals/ProductModel")
const sendProductListEmail = require("../../helper/emailProductList");

class CategoriesController {

  async AddCategories(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: 'Category name required' });
      const existing = await Category.findOne({ name });
      if (existing) return res.status(400).json({ message: 'Category already exists' });
      const cat = new Category({ name });
      await cat.save();
      res.status(201).json(cat);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async AddProduct(req, res) {
    try {
      const { name, price, categoryId, stock } = req.body;
      if (!name || price == null || !categoryId) return res.status(400).json({ message: 'Name, price and categoryId required' });
      const category = await Category.findById(categoryId);
      if (!category) return res.status(400).json({ message: 'Invalid category' });
      const p = new Product({ name, price: Number(price), category: category._id, stock: Number(stock || 0) });
      await p.save();
      res.status(201).json(p);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async ListCategoriesWithProducts(req, res) {
    try {
      const data = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $addFields: { totalProducts: { $size: '$products' } }
        },
        { $project: { name: 1, totalProducts: 1, products: 1 } }
      ]);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }


  async ListOfProducts(req, res) {
    try {
      const products = await Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: {
            path: '$categoryInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            stock: 1,
            categoryId: '$category',
            categoryName: '$categoryInfo.name'
          }
        }
      ]);

      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async EditProductInformation(req, res) {
    try {
      const { id } = req.params;
      const updates = {};

      if (req.body.name) updates.name = req.body.name;
      if (req.body.price != null) updates.price = Number(req.body.price);

      if (req.body.categoryId) {
        const cat = await Category.findById(req.body.categoryId);
        if (!cat) return res.status(400).json({ message: 'Invalid categoryId' });
        updates.category = cat._id;
      }

      if (req.body.stock != null) updates.stock = Number(req.body.stock);

      const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ message: 'Product not found' });

      const productWithCategory = await Product.aggregate([
        { $match: { _id: updated._id } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            stock: 1,
            categoryId: '$category',
            categoryName: '$categoryInfo.name'
          }
        }
      ]);

      res.json(productWithCategory[0] || {});
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async DeleteProductInformation(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndDelete(id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json({ message: 'Product deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async StockLessThan(req, res) {
    try {
      const products = await Product.aggregate([
        {
          $match: { stock: { $lt: 1 } }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: {
            path: '$categoryInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            stock: 1,
            categoryId: '$category',
            categoryName: '$categoryInfo.name'
          }
        }
      ]);

      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async sendProductListToEmail(req, res) {
    try {
      const { email } = req.body;
      const userName = req.user ? req.user.name : 'User';

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email address is required' 
        });
      }

      await sendProductListEmail(email, userName);

      res.status(200).json({
        success: true,
        message: 'Product list has been sent to your email successfully'
      });

    } catch (error) {
      console.error('Send Product List Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send product list email'
      });
    }
  }

}

module.exports = new CategoriesController();
