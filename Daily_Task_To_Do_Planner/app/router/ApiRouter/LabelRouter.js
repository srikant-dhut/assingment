const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const LabelController = require("../../controller/ApiController/LabelController");


router.post('/addLabel', authMiddleware, LabelController.addLabel);
router.put('/editLabel/:labelId', authMiddleware, LabelController.editLabel);
router.delete('/deleteLabel/:labelId', authMiddleware, LabelController.deleteLabel);
router.get('/listLabels', authMiddleware, LabelController.listLabels);

module.exports = router;