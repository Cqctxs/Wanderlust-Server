const express = require('express');
const router = express.Router();
const userController = require('../../controllers/api/userController');

router.get('/:username', userController.getUserByUsername);
router.put('/:username', userController.updateUserByUsername);

module.exports = router;