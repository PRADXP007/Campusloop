const express = require('express');
const router = express.Router();
const State = require('../models/State');

router.get('/', async (req, res, next) => {
  try {
    const states = await State.find({}).sort({ name: 1 });
    res.json({ success: true, states });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
