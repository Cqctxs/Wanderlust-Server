const express = require('express');
const router = express.Router();
const userController = require('../../controllers/api/userController');

router.post('/', userController.getUser);

module.exports = router;