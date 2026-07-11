const mongoose = require('mongoose');
require('dotenv').config();

const State = require('../models/State');
const District = require('../models/District');
const College = require('../models/College');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusloop';
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    
    const statesCount = await State.countDocuments({});
    const districtsCount = await District.countDocuments({});
    const collegesCount = await College.countDocuments({});
    
    console.log('--- Database Record Counts ---');
    console.log('States:', statesCount);
    console.log('Districts:', districtsCount);
    console.log('Colleges:', collegesCount);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error running count:', err);
    process.exit(1);
  }
}

run();
