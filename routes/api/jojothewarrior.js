const express = require('express');
const router = express.Router();
const jojothewarriorController = require("../../controllers/api/jojothewarriorController")

router.put('/', jojothewarriorController.setInteger);
router.get('/', jojothewarriorController.getInteger);

module.exports = router;