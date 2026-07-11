const fs = require('fs');
const path = require('path');

const collegesPath = path.join(__dirname, '../../node_modules/indian-colleges/colleges.json');
const rawData = fs.readFileSync(collegesPath, 'utf8');
const colleges = JSON.parse(rawData);

console.log('Total entries in colleges.json:', colleges.length);
if (colleges.length > 0) {
  console.log('Sample entry:', colleges[0]);
  
  // Let's count unique states, districts, and universities
  const states = new Set();
  const districts = new Set();
  const universities = new Set();
  
  colleges.forEach(item => {
    if (item.state) states.add(item.state);
    if (item.district) districts.add(item.district);
    if (item.university) universities.add(item.university);
  });
  
  console.log('Unique states:', states.size);
  console.log('Unique districts:', districts.size);
  console.log('Unique universities:', universities.size);
  
  console.log('List of states:', Array.from(states).sort());
}
