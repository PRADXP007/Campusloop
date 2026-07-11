require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const College = require('../models/College');
const State = require('../models/State');
const District = require('../models/District');
const University = require('../models/University');

const baselineColleges = [
  // Maharashtra
  {
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IIT Bombay',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    city: 'Mumbai',
    university: 'IIT',
    emailDomain: 'iitb.ac.in',
    type: 'autonomous',
  },
  {
    name: 'College of Engineering Pune',
    shortName: 'COEP',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    university: 'Savitribai Phule Pune University',
    emailDomain: 'coep.org.in',
    type: 'autonomous',
  },
  {
    name: 'Veermata Jijabai Technological Institute',
    shortName: 'VJTI',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    university: 'University of Mumbai',
    emailDomain: 'vjti.ac.in',
    type: 'autonomous',
  },
  
  // Tamil Nadu
  {
    name: 'Indian Institute of Technology Madras',
    shortName: 'IIT Madras',
    state: 'Tamil Nadu',
    district: 'Chennai',
    city: 'Chennai',
    university: 'IIT',
    emailDomain: 'iitm.ac.in',
    type: 'autonomous',
  },
  {
    name: 'National Institute of Technology Tiruchirappalli',
    shortName: 'NIT Trichy',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    city: 'Tiruchirappalli',
    university: 'NIT',
    emailDomain: 'nitt.edu',
    type: 'autonomous',
  },
  {
    name: 'College of Engineering Guindy',
    shortName: 'CEG',
    state: 'Tamil Nadu',
    district: 'Chennai',
    city: 'Chennai',
    university: 'Anna University',
    emailDomain: 'annauniv.edu',
    type: 'government',
  },

  // Delhi
  {
    name: 'Indian Institute of Technology Delhi',
    shortName: 'IIT Delhi',
    state: 'Delhi',
    district: 'South Delhi',
    city: 'New Delhi',
    university: 'IIT',
    emailDomain: 'iitd.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Delhi Technological University',
    shortName: 'DTU',
    state: 'Delhi',
    district: 'North West Delhi',
    city: 'Delhi',
    university: 'DTU',
    emailDomain: 'dtu.ac.in',
    type: 'government',
  },
  {
    name: 'Netaji Subhas University of Technology',
    shortName: 'NSUT',
    state: 'Delhi',
    district: 'South West Delhi',
    city: 'Delhi',
    university: 'NSUT',
    emailDomain: 'nsut.ac.in',
    type: 'government',
  },

  // Karnataka
  {
    name: 'Indian Institute of Science Bangalore',
    shortName: 'IISc',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    university: 'IISc',
    emailDomain: 'iisc.ac.in',
    type: 'autonomous',
  },
  {
    name: 'National Institute of Technology Karnataka',
    shortName: 'NITK Surathkal',
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    city: 'Surathkal',
    university: 'NIT',
    emailDomain: 'nitk.ac.in',
    type: 'autonomous',
  },
  {
    name: 'R.V. College of Engineering',
    shortName: 'RVCE',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    university: 'Visvesvaraya Technological University',
    emailDomain: 'rvce.edu.in',
    type: 'autonomous',
  },

  // Telangana
  {
    name: 'Indian Institute of Technology Hyderabad',
    shortName: 'IIT Hyderabad',
    state: 'Telangana',
    district: 'Sangareddy',
    city: 'Kandi',
    university: 'IIT',
    emailDomain: 'iith.ac.in',
    type: 'autonomous',
  },
  {
    name: 'International Institute of Information Technology Hyderabad',
    shortName: 'IIIT Hyderabad',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Gachibowli',
    university: 'Deemed',
    emailDomain: 'iiit.ac.in',
    type: 'private',
  },
  {
    name: 'Birla Institute of Technology and Science Pilani Hyderabad Campus',
    shortName: 'BITS Hyderabad',
    state: 'Telangana',
    district: 'Medchal-Malkajgiri',
    city: 'Secunderabad',
    university: 'BITS Pilani',
    emailDomain: 'hyderabad.bits-pilani.ac.in',
    type: 'private',
  },

  // West Bengal
  {
    name: 'Indian Institute of Technology Kharagpur',
    shortName: 'IIT Kharagpur',
    state: 'West Bengal',
    district: 'Paschim Medinipur',
    city: 'Kharagpur',
    university: 'IIT',
    emailDomain: 'iitkgp.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Jadavpur University',
    shortName: 'JU',
    state: 'West Bengal',
    district: 'Kolkata',
    city: 'Kolkata',
    university: 'Jadavpur University',
    emailDomain: 'jadavpuruniversity.in',
    type: 'government',
  },

  // Uttar Pradesh
  {
    name: 'Indian Institute of Technology Kanpur',
    shortName: 'IIT Kanpur',
    state: 'Uttar Pradesh',
    district: 'Kanpur Nagar',
    city: 'Kanpur',
    university: 'IIT',
    emailDomain: 'iitk.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Motilal Nehru National Institute of Technology',
    shortName: 'MNNIT Allahabad',
    state: 'Uttar Pradesh',
    district: 'Prayagraj',
    city: 'Prayagraj',
    university: 'NIT',
    emailDomain: 'mnnit.ac.in',
    type: 'autonomous',
  },

  // Rajasthan
  {
    name: 'Birla Institute of Technology and Science Pilani',
    shortName: 'BITS Pilani',
    state: 'Rajasthan',
    district: 'Jhunjhunu',
    city: 'Pilani',
    university: 'BITS Pilani',
    emailDomain: 'bits-pilani.ac.in',
    type: 'private',
  },
  {
    name: 'Malaviya National Institute of Technology',
    shortName: 'MNIT Jaipur',
    state: 'Rajasthan',
    district: 'Jaipur',
    city: 'Jaipur',
    university: 'NIT',
    emailDomain: 'mnit.ac.in',
    type: 'autonomous',
  },

  // Gujarat
  {
    name: 'Indian Institute of Technology Gandhinagar',
    shortName: 'IIT Gandhinagar',
    state: 'Gujarat',
    district: 'Gandhinagar',
    city: 'Gandhinagar',
    university: 'IIT',
    emailDomain: 'iitgn.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Sardar Vallabhbhai National Institute of Technology',
    shortName: 'SVNIT Surat',
    state: 'Gujarat',
    district: 'Surat',
    city: 'Surat',
    university: 'NIT',
    emailDomain: 'svnit.ac.in',
    type: 'autonomous',
  }
];

const seed = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await College.deleteMany({});
    await University.deleteMany({});
    await District.deleteMany({});
    await State.deleteMany({});

    // 1. Seed unique States
    const stateNames = [...new Set(baselineColleges.map(c => c.state))];
    const stateMap = {};
    for (const name of stateNames) {
      const stateDoc = await State.create({
        name,
        isUnionTerritory: name === 'Delhi'
      });
      stateMap[name] = stateDoc._id;
    }
    console.log(`✅ Seeded ${stateNames.length} States.`);

    // 2. Seed unique Districts
    const districtMap = {};
    for (const college of baselineColleges) {
      const key = `${college.state}_${college.district}`;
      if (!districtMap[key]) {
        const stateId = stateMap[college.state];
        const districtDoc = await District.create({
          name: college.district,
          state: stateId
        });
        districtMap[key] = districtDoc._id;
      }
    }
    console.log('✅ Seeded Districts.');

    // 3. Seed unique Universities
    const universityMap = {};
    for (const college of baselineColleges) {
      if (college.university && !universityMap[college.university]) {
        const stateId = stateMap[college.state];
        const districtId = districtMap[`${college.state}_${college.district}`];
        const universityDoc = await University.create({
          name: college.university,
          shortName: college.university.split(' ').map(w => w[0]).join('').substring(0, 8),
          state: stateId,
          district: districtId,
          city: college.city
        });
        universityMap[college.university] = universityDoc._id;
      }
    }
    console.log('✅ Seeded Universities.');

    // 4. Map baseline colleges to ObjectIds
    const collegesToInsert = baselineColleges.map(c => ({
      name: c.name,
      shortName: c.shortName,
      state: stateMap[c.state],
      district: districtMap[`${c.state}_${c.district}`],
      city: c.city,
      university: c.university ? universityMap[c.university] : null,
      emailDomain: c.emailDomain,
      type: c.type,
    }));

    console.log(`🌱 Seeding ${collegesToInsert.length} baseline Indian colleges...`);
    const docs = await College.insertMany(collegesToInsert);
    console.log(`✅ Successfully seeded ${docs.length} colleges.`);

    console.log('\n--- SCALE STRATEGY FOR MILLIONS OF STUDENTS ---');
    console.log('1. National Dataset: Import All India Survey on Higher Education (AISHE) JSON data (45k+ colleges).');
    console.log('2. Indexes Added: compound { state: 1, district: 1 } and text { name: "text", shortName: "text" }.');
    console.log('3. Pagination: Queries are restricted with limit() bounds to ensure responsive mobile loads.');
    console.log('4. Dynamic Overrides: Users can add unrecognized local colleges instantly via the POST /colleges endpoint.');
    console.log('-------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
