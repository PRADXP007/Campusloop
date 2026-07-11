const indianColleges = require('indian-colleges');

console.log('Type of getAllColleges:', typeof indianColleges.getAllColleges);
try {
  const colleges = indianColleges.getAllColleges();
  console.log('Total Colleges:', colleges.length);
  if (colleges.length > 0) {
    console.log('Sample College:', colleges[0], 'Type:', typeof colleges[0]);
  }
} catch (e) { console.error('colleges error', e); }

try {
  const universities = indianColleges.getAllUniversities();
  console.log('Total Universities:', universities.length);
  if (universities.length > 0) {
    console.log('Sample University:', universities[0], 'Type:', typeof universities[0]);
  }
} catch (e) { console.error('universities error', e); }

try {
  const stateColleges = indianColleges.getCollegesByState('Karnataka');
  console.log('Karnataka Colleges Count:', stateColleges.length);
  if (stateColleges.length > 0) {
    console.log('Sample Karnataka College:', stateColleges[0]);
  }
} catch (e) { console.error('Karnataka error', e); }
