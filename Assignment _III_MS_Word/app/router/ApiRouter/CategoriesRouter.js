const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const CategoriesController = require("../../controller/ApiController/CategoriesController");


router.post('/addCategories', authMiddleware, CategoriesController.AddCategories);
router.post('/addProducts', authMiddleware, CategoriesController.AddProduct);
router.get('/ListCategoriesWithProducts', CategoriesController.ListCategoriesWithProducts);

router.get('/listOfProducts', CategoriesController.ListOfProducts);

router.put('/editProductInformation/:id', authMiddleware, CategoriesController.EditProductInformation);

router.delete('/deleteProductInformation/:id', authMiddleware, CategoriesController.DeleteProductInformation)

router.get('/stockLessThan', CategoriesController.StockLessThan)

router.post('/sendProductListToEmail', authMiddleware, CategoriesController.sendProductListToEmail)

module.exports = router;
