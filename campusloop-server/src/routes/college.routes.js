const express = require('express');
const router = express.Router();
const {
  listColleges,
  getStates,
  getDistricts,
  searchColleges,
  createCollege,
  detectCollegeFromEmail,
  getCollegeById,
} = require('../controllers/college.controller');

// Public endpoints for registration
router.get('/', listColleges);
router.get('/states', getStates);
router.get('/districts', getDistricts);
router.get('/search', searchColleges);
router.get('/detect', detectCollegeFromEmail);
router.get('/:id', getCollegeById);
router.post('/', createCollege);

module.exports = router;
