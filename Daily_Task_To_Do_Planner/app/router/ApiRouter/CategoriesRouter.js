const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const CategoriesController = require("../../controller/ApiController/CategoriesController");


router.post('/addCategory', authMiddleware, CategoriesController.addCategory);
router.put('/editCategory/:categoryId', authMiddleware, CategoriesController.editCategory);
router.delete('/deleteCategory/:categoryId', authMiddleware, CategoriesController.deleteCategory);
router.get('/listCategories', authMiddleware, CategoriesController.listCategories);

module.exports = router;
