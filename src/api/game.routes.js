const express = require('express');
const router = express.Router();
const { placeBet } = require('../controllers/game.controller');

router.post('/bet', placeBet);

module.exports = router;