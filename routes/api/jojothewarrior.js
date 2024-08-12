const express = require('express');
const router = express.Router();
const jojothewarriorController = require("../../controllers/api/jojothewarriorController")

router.get('/', jojothewarriorController.getItinerary);

module.exports = router;