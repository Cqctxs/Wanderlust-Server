const express = require('express');
const router = express.Router();
const generateController = require('../../controllers/api/generateController');

router.post('/', generateController.getItenerary);

module.exports = router;