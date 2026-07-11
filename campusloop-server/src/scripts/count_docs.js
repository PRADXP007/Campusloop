require('dotenv').config();
const mongoose = require('mongoose');

const State = require('../models/State');
const District = require('../models/District');
const University = require('../models/University');
const College = require('../models/College');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusloop';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  
  const states = await State.countDocuments();
  const districts = await District.countDocuments();
  const universities = await University.countDocuments();
  const colleges = await College.countDocuments();
  
  console.log('Counts:');
  console.log('States:', states);
  console.log('Districts:', districts);
  console.log('Universities:', universities);
  console.log('Colleges:', colleges);
  
  await mongoose.disconnect();
}

run().catch(console.error);
