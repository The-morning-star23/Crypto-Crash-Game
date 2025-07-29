const express = require('express');
const router = express.Router();
const { createUser, getWalletBalance } = require('../controllers/user.controller');

router.post('/', createUser);
router.get('/:userId/wallet', getWalletBalance);

module.exports = router;