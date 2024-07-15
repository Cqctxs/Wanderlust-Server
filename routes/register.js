const express = require('express');
const router = express.Router();
const resgisterController = require('../controllers/registerController');

router.post('/', resgisterController.handleNewUser);

module.exports = router;