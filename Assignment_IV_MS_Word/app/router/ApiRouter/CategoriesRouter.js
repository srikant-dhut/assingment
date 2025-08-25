const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const CategoriesController = require("../../controller/ApiController/CategoriesController");


router.post('/addCategories', authMiddleware, CategoriesController.addCategory);

router.get('/ListCategoriesWithProducts', CategoriesController.listCategoriesWithPosts);

module.exports = router;
