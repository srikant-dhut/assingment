const express = require("express");
const router = express.Router();
const CategoriesController = require("../../controller/ApiController/CategoriesController");

router.get("/categories", CategoriesController.listWithQuestionCount);
router.post("/categoriesadd", CategoriesController.addCategory);

module.exports = router;
