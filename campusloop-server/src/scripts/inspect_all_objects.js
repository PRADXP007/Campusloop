const indianColleges = require('indian-colleges');

try {
  const all = indianColleges.getAllCollegesAndUniversities();
  console.log('Sample item from all:', all[0]);
  console.log('Type of sample item:', typeof all[0]);
  
  // Let's find some objects in the list if there are any
  const objects = all.filter(item => typeof item === 'object');
  console.log('Number of object items:', objects.length);
  if (objects.length > 0) {
    console.log('First object item:', objects[0]);
  }
} catch (e) {
  console.error(e);
}
