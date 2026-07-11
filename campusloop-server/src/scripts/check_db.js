require('dotenv').config();
const mongoose = require('mongoose');

const State = require('../models/State');
const District = require('../models/District');
const College = require('../models/College');

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');
    
    const oneDistrict = await District.findOne({});
    console.log('Sample District:', JSON.stringify(oneDistrict, null, 2));

    if (oneDistrict) {
      const parentState = await State.findById(oneDistrict.state);
      console.log('Parent State of that District:', JSON.stringify(parentState, null, 2));
    }
    
    // Check how many districts have valid states
    const districtsCount = await District.countDocuments({});
    console.log('Total districts:', districtsCount);

    process.exit(0);
  } catch (error) {
    console.error('Error checking DB:', error);
    process.exit(1);
  }
};

checkDB();
