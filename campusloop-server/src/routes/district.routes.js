const express = require('express');
const router = express.Router();
const District = require('../models/District');
const State = require('../models/State');

router.get('/', async (req, res, next) => {
  try {
    const { stateId, state } = req.query;

    let filter = {};
    if (stateId) {
      filter.state = stateId;
    } else if (state) {
      const stateDoc = await State.findOne({ name: { $regex: `^${state.trim()}$`, $options: 'i' } });
      if (!stateDoc) {
        return res.json({ success: true, districts: [] });
      }
      filter.state = stateDoc._id;
    } else {
      return res.status(400).json({ success: false, message: 'stateId or state query parameter is required.' });
    }

    const districts = await District.find(filter).sort({ name: 1 });
    res.json({ success: true, districts });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
