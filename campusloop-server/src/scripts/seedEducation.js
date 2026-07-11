require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const State = require('../models/State');
const District = require('../models/District');
const University = require('../models/University');
const College = require('../models/College');
const aisheData = require('aishe-institutions-list/data/institutions.json');

const fs = require('fs');
const path = require('path');
const collegesPath = path.join(__dirname, '../../node_modules/indian-colleges/colleges.json');
const icData = JSON.parse(fs.readFileSync(collegesPath, 'utf8'));

const normalize = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const mapStateName = (st) => {
  if (!st) return '';
  let s = st.trim().toLowerCase();
  if (s === 'chhatisgarh' || s === 'chhattisgarh') return 'chhattisgarh';
  if (s === 'uttrakhand' || s === 'uttarakhand') return 'uttarakhand';
  if (s.includes('dadra') || (s.includes('daman') && !s.includes('andaman')) || s.includes('diu')) {
    return 'dadra and nagar haveli and daman and diu';
  }
  if (s === 'orissa' || s === 'odisha') return 'odisha';
  if (s === 'pondicherry' || s === 'puducherry') return 'puducherry';
  return s;
};

const cleanName = (nameStr) => {
  if (!nameStr) return '';
  return nameStr.replace(/\(Id:\s*[A-Z0-9-]+\)/gi, '').trim();
};

const unionTerritories = new Set([
  'andaman and nicobar islands',
  'chandigarh',
  'dadra and nagar haveli and daman and diu',
  'delhi',
  'jammu and kashmir',
  'ladakh',
  'lakshadweep',
  'puducherry'
]);

const baselineColleges = [
  // Maharashtra
  {
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IIT Bombay',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    city: 'Mumbai',
    university: 'Indian Institute of Technology',
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
    university: 'Indian Institute of Technology',
    emailDomain: 'iitm.ac.in',
    type: 'autonomous',
  },
  {
    name: 'National Institute of Technology Tiruchirappalli',
    shortName: 'NIT Trichy',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    city: 'Tiruchirappalli',
    university: 'Indian Institute of Technology',
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
    university: 'Indian Institute of Technology',
    emailDomain: 'iitd.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Delhi Technological University',
    shortName: 'DTU',
    state: 'Delhi',
    district: 'North West Delhi',
    city: 'Delhi',
    university: 'Delhi Technological University',
    emailDomain: 'dtu.ac.in',
    type: 'government',
  },
  {
    name: 'Netaji Subhas University of Technology',
    shortName: 'NSUT',
    state: 'Delhi',
    district: 'South West Delhi',
    city: 'Delhi',
    university: 'Delhi Technological University',
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
    university: 'Indian Institute of Technology',
    emailDomain: 'iisc.ac.in',
    type: 'autonomous',
  },
  {
    name: 'National Institute of Technology Karnataka',
    shortName: 'NITK Surathkal',
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    city: 'Surathkal',
    university: 'Indian Institute of Technology',
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

  // West Bengal
  {
    name: 'Indian Institute of Technology Kharagpur',
    shortName: 'IIT Kharagpur',
    state: 'West Bengal',
    district: 'Paschim Medinipur',
    city: 'Kharagpur',
    university: 'Indian Institute of Technology',
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
    university: 'Indian Institute of Technology',
    emailDomain: 'iitk.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Motilal Nehru National Institute of Technology',
    shortName: 'MNNIT Allahabad',
    state: 'Uttar Pradesh',
    district: 'Prayagraj',
    city: 'Prayagraj',
    university: 'Indian Institute of Technology',
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
    university: 'Birla Institute of Technology and Science Pilani',
    emailDomain: 'bits-pilani.ac.in',
    type: 'private',
  },
  {
    name: 'Malaviya National Institute of Technology',
    shortName: 'MNIT Jaipur',
    state: 'Rajasthan',
    district: 'Jaipur',
    city: 'Jaipur',
    university: 'Indian Institute of Technology',
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
    university: 'Indian Institute of Technology',
    emailDomain: 'iitgn.ac.in',
    type: 'autonomous',
  },
  {
    name: 'Sardar Vallabhbhai National Institute of Technology',
    shortName: 'SVNIT Surat',
    state: 'Gujarat',
    district: 'Surat',
    city: 'Surat',
    university: 'Indian Institute of Technology',
    emailDomain: 'svnit.ac.in',
    type: 'autonomous',
  },

  // Telangana
  {
    name: 'Indian Institute of Technology Hyderabad',
    shortName: 'IIT Hyderabad',
    state: 'Telangana',
    district: 'Sangareddy',
    city: 'Kandi',
    university: 'Indian Institute of Technology',
    emailDomain: 'iith.ac.in',
    type: 'autonomous',
  },
  {
    name: 'International Institute of Information Technology Hyderabad',
    shortName: 'IIIT Hyderabad',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Gachibowli',
    university: 'International Institute of Information Technology Hyderabad',
    emailDomain: 'iiit.ac.in',
    type: 'private',
  },
  {
    name: 'Birla Institute of Technology and Science Pilani Hyderabad Campus',
    shortName: 'BITS Hyderabad',
    state: 'Telangana',
    district: 'Medchal-Malkajgiri',
    city: 'Secunderabad',
    university: 'Birla Institute of Technology and Science Pilani',
    emailDomain: 'hyderabad.bits-pilani.ac.in',
    type: 'private',
  },
  {
    name: 'Jain University',
    shortName: 'JU',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    university: 'Jain University',
    emailDomain: 'jainuniversity.ac.in',
    type: 'private',
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

    console.log('🌎 Extracting and seeding States...');
    const uniqueStates = new Set();
    aisheData.forEach(item => {
      if (item.state) {
        let st = item.state.trim();
        if (st === 'The Dadra and Nagar Haveli and Daman and Diu') {
          st = 'Dadra and Nagar Haveli and Daman and Diu';
        }
        uniqueStates.add(st);
      }
    });

    const stateDocs = [];
    const stateMap = new Map(); // key: lowercase normalized state name -> ObjectId
    for (const stateName of Array.from(uniqueStates).sort()) {
      const isUT = unionTerritories.has(stateName.toLowerCase());
      const stateDoc = await State.create({
        name: stateName,
        isUnionTerritory: isUT
      });
      stateMap.set(mapStateName(stateName), stateDoc._id);
      stateDocs.push(stateDoc);
    }
    console.log(`✅ Seeded ${stateDocs.length} States.`);

    console.log('📍 Extracting and seeding Districts...');
    const uniqueDistricts = new Map(); // key: stateName_distName -> { stateName, distName }
    
    // Add default "General" district for each state to handle missing districts
    for (const stateName of Array.from(uniqueStates)) {
      uniqueDistricts.set(`${mapStateName(stateName)}_general`, { stateName, distName: 'General' });
    }

    // Pre-add any baseline districts to avoid lookups failing
    baselineColleges.forEach(bc => {
      uniqueDistricts.set(`${mapStateName(bc.state)}_${bc.district.toLowerCase()}`, { stateName: bc.state, distName: bc.district });
    });

    aisheData.forEach(item => {
      if (item.state) {
        let st = item.state.trim();
        if (st === 'The Dadra and Nagar Haveli and Daman and Diu') {
          st = 'Dadra and Nagar Haveli and Daman and Diu';
        }
        const dist = item.district ? item.district.trim() : 'General';
        if (dist) {
          const key = `${mapStateName(st)}_${dist.toLowerCase()}`;
          if (!uniqueDistricts.has(key)) {
            uniqueDistricts.set(key, { stateName: st, distName: dist });
          }
        }
      }
    });

    const districtMap = new Map(); // key: stateName_distName -> ObjectId
    const districtDocsToInsert = [];
    
    for (const [key, val] of uniqueDistricts.entries()) {
      const stateId = stateMap.get(mapStateName(val.stateName));
      if (stateId) {
        districtDocsToInsert.push({
          name: val.distName,
          state: stateId
        });
      }
    }

    console.log(`🌱 Inserting ${districtDocsToInsert.length} Districts in bulk...`);
    const insertedDistricts = await District.insertMany(districtDocsToInsert);
    
    // Populate districtMap
    let distIndex = 0;
    for (const [key, val] of uniqueDistricts.entries()) {
      districtMap.set(key, insertedDistricts[distIndex]._id);
      distIndex++;
    }
    console.log(`✅ Seeded ${insertedDistricts.length} Districts.`);

    console.log('🏛️ Seeding Universities...');
    const universityMap = new Map(); // key: normalized name -> ObjectId
    const universityDocsToInsert = [];

    // Helper to extract baseline overrides
    const baselineMap = new Map(); // key: normalizedName -> baseline record
    baselineColleges.forEach(bc => {
      baselineMap.set(normalize(bc.name), bc);
    });

    // 1. Process universities from AISHE list (prefix U-)
    aisheData.forEach(item => {
      if (item.aishe_code && item.aishe_code.startsWith('U-')) {
        const uniName = item.name.trim();
        const normName = normalize(uniName);
        if (!universityMap.has(normName)) {
          // Check baseline overrides for the university
          const baseline = baselineMap.get(normName);
          
          const stateName = baseline?.state || (item.state.trim() === 'The Dadra and Nagar Haveli and Daman and Diu'
            ? 'Dadra and Nagar Haveli and Daman and Diu'
            : item.state.trim());
          const stateId = stateMap.get(mapStateName(stateName));
          
          const distName = baseline?.district || (item.district ? item.district.trim() : 'General');
          const distId = districtMap.get(`${mapStateName(stateName)}_${distName.toLowerCase()}`);
          
          const uniId = new mongoose.Types.ObjectId();
          universityMap.set(normName, uniId);
          universityDocsToInsert.push({
            _id: uniId,
            name: uniName,
            shortName: baseline?.shortName || uniName.split(' ').map(w => w[0]).join('').substring(0, 8),
            state: stateId,
            district: distId || null,
            city: baseline?.city || distName
          });
        }
      }
    });

    // 2. Extract and pre-seed any additional universities from the indian-colleges dataset that are not in the AISHE list
    const icUniversities = new Set();
    icData.forEach(item => {
      if (item.university) {
        const cleaned = cleanName(item.university);
        if (cleaned) icUniversities.add(cleaned);
      }
    });

    icUniversities.forEach(uniName => {
      const normName = normalize(uniName);
      if (!universityMap.has(normName)) {
        // Try to find state/district details from an entry in indian-colleges
        const sampleEntry = icData.find(item => item.university && cleanName(item.university) === uniName);
        if (sampleEntry) {
          const stateName = sampleEntry.state.trim();
          const stateId = stateMap.get(mapStateName(stateName));
          if (stateId) {
            const distName = sampleEntry.district ? sampleEntry.district.trim() : 'General';
            const distId = districtMap.get(`${mapStateName(stateName)}_${distName.toLowerCase()}`) || 
                           districtMap.get(`${mapStateName(stateName)}_general`);
            
            const uniId = new mongoose.Types.ObjectId();
            universityMap.set(normName, uniId);
            universityDocsToInsert.push({
              _id: uniId,
              name: uniName,
              shortName: uniName.split(' ').map(w => w[0]).join('').substring(0, 8),
              state: stateId,
              district: distId || null,
              city: distName
            });
          }
        }
      }
    });

    console.log(`🌱 Inserting ${universityDocsToInsert.length} Universities in bulk...`);
    await University.insertMany(universityDocsToInsert);
    console.log(`✅ Seeded ${universityDocsToInsert.length} Universities.`);

    console.log('🔗 Mapping college-to-university affiliations...');
    // Create lookup: state_district_collegeName -> universityName
    const icAffiliations = new Map();
    icData.forEach(item => {
      if (item.college && item.university) {
        const cleanCol = cleanName(item.college);
        const cleanUni = cleanName(item.university);
        const key = `${mapStateName(item.state)}_${normalize(item.district)}_${normalize(cleanCol)}`;
        icAffiliations.set(key, cleanUni);
      }
    });

    console.log('🏫 Preparing College documents for all 70,865 AISHE records...');
    const collegesToInsert = [];
    const processedCollegeKeys = new Set(); // to avoid duplicates

    // We also insert the Universities as selectable colleges
    universityDocsToInsert.forEach(uni => {
      const normName = normalize(uni.name);
      const key = `${uni.state}_${uni.district}_${normName}`;
      processedCollegeKeys.add(key);

      const baseline = baselineMap.get(normName);
      collegesToInsert.push({
        name: uni.name,
        shortName: baseline?.shortName || uni.shortName,
        state: uni.state,
        district: uni.district,
        city: uni.city,
        university: uni._id,
        emailDomain: baseline?.emailDomain || '',
        type: baseline?.type || 'autonomous'
      });
    });

    // Now process all records in AISHE list
    aisheData.forEach(item => {
      // Skip universities since they are already processed above
      if (item.aishe_code && item.aishe_code.startsWith('U-')) {
        return;
      }

      const rawColName = item.name.trim();
      const normColName = normalize(rawColName);
      
      const stateName = item.state.trim() === 'The Dadra and Nagar Haveli and Daman and Diu'
        ? 'Dadra and Nagar Haveli and Daman and Diu'
        : item.state.trim();
      const stateId = stateMap.get(mapStateName(stateName));
      if (!stateId) return;

      const distName = item.district ? item.district.trim() : 'General';
      const distId = districtMap.get(`${mapStateName(stateName)}_${distName.toLowerCase()}`);
      if (!distId) return;

      const key = `${stateId}_${distId}_${normColName}`;
      if (processedCollegeKeys.has(key)) return;
      processedCollegeKeys.add(key);

      // Check if it's in baseline list to override values
      const baseline = baselineMap.get(normColName);
      
      // Determine university affiliation from indian-colleges mappings
      let uniId = null;
      const lookupKey = `${mapStateName(stateName)}_${normalize(distName)}_${normColName}`;
      if (icAffiliations.has(lookupKey)) {
        const uniName = icAffiliations.get(lookupKey);
        const normUniName = normalize(uniName);
        if (universityMap.has(normUniName)) {
          uniId = universityMap.get(normUniName);
        }
      }

      // Fallback domain generator
      let emailDomain = '';
      if (baseline?.emailDomain) {
        emailDomain = baseline.emailDomain;
      } else {
        const slug = rawColName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
        emailDomain = `${slug}.edu.in`;
      }

      // Determine type
      let type = '';
      if (baseline?.type) {
        type = baseline.type;
      } else if (item.aishe_code && (item.aishe_code.startsWith('S-') || item.aishe_code.startsWith('R-'))) {
        type = 'other';
      } else {
        type = rawColName.toLowerCase().includes('private') ? 'private' : 'government';
      }

      collegesToInsert.push({
        name: rawColName,
        shortName: baseline?.shortName || rawColName.split(' ').map(w => w[0]).join('').substring(0, 8),
        state: stateId,
        district: distId,
        city: distName,
        university: uniId,
        emailDomain,
        type
      });
    });

    console.log(`🌱 Bulk inserting ${collegesToInsert.length} College records...`);
    const BATCH_SIZE = 5000;
    for (let i = 0; i < collegesToInsert.length; i += BATCH_SIZE) {
      const batch = collegesToInsert.slice(i, i + BATCH_SIZE);
      await College.insertMany(batch);
      console.log(`  Imported ${i + batch.length}/${collegesToInsert.length}...`);
    }
    console.log('✅ Successfully seeded all college and university records.');

    console.log('\n🎉 Complete India-wide Seeding Completed Successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
