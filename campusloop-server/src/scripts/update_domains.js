require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const College = require('../models/College');
const State = require('../models/State');
const District = require('../models/District');
const University = require('../models/University');

async function main() {
  try {
    await connectDB();

    // Read and parse baselineColleges from seedColleges.js
    const seedCollegesPath = path.join(__dirname, 'seedColleges.js');
    const content = fs.readFileSync(seedCollegesPath, 'utf8');
    const arrayMatch = content.match(/const baselineColleges = (\[[\s\S]*?\]);/);
    if (!arrayMatch) {
      throw new Error('Failed to find baselineColleges array in seedColleges.js');
    }
    const baselineColleges = eval(arrayMatch[1]);
    console.log(`Parsed ${baselineColleges.length} baseline colleges from seedColleges.js`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const base of baselineColleges) {
      // Find college by exact name or case-insensitive name
      let collegeDoc = await College.findOne({
        name: { $regex: new RegExp(`^${base.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      });

      if (collegeDoc) {
        // Update existing college with emailDomain, shortName, and type
        collegeDoc.emailDomain = base.emailDomain;
        collegeDoc.shortName = base.shortName;
        collegeDoc.type = base.type;
        await collegeDoc.save();
        updatedCount++;
        console.log(`✅ Updated existing college: ${base.name} -> ${base.emailDomain}`);
      } else {
        // Create new college: find state and district
        let stateDoc = await State.findOne({
          name: { $regex: new RegExp(`^${base.state}$`, 'i') }
        });
        if (!stateDoc) {
          stateDoc = await State.create({ name: base.state, isUnionTerritory: base.state === 'Delhi' });
        }

        let districtDoc = await District.findOne({
          name: { $regex: new RegExp(`^${base.district}$`, 'i') },
          state: stateDoc._id
        });
        if (!districtDoc) {
          districtDoc = await District.create({ name: base.district, state: stateDoc._id });
        }

        let universityId = null;
        if (base.university) {
          let univDoc = await University.findOne({
            name: { $regex: new RegExp(`^${base.university}$`, 'i') }
          });
          if (!univDoc) {
            univDoc = await University.create({
              name: base.university,
              shortName: base.university.split(' ').map(w => w[0]).join('').substring(0, 8),
              state: stateDoc._id,
              district: districtDoc._id,
              city: base.city
            });
          }
          universityId = univDoc._id;
        }

        await College.create({
          name: base.name,
          shortName: base.shortName,
          state: stateDoc._id,
          district: districtDoc._id,
          city: base.city,
          university: universityId,
          emailDomain: base.emailDomain,
          type: base.type
        });
        createdCount++;
        console.log(`➕ Created new college: ${base.name} -> ${base.emailDomain}`);
      }
    }

    console.log(`\n🎉 Process completed successfully!`);
    console.log(`- Updated: ${updatedCount} colleges`);
    console.log(`- Created: ${createdCount} colleges`);

    await mongoose.disconnect();
    console.log('Disconnected from database.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
