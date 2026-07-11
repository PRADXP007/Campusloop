const mongoose = require('mongoose');
const College = require('../models/College');
const State = require('../models/State');
const District = require('../models/District');
const University = require('../models/University');

/**
 * Helper to build college query filter dynamically
 */
const buildCollegeFilter = async (query) => {
  const { state, district } = query;
  const filter = {};

  if (state) {
    if (mongoose.Types.ObjectId.isValid(state)) {
      filter.state = state;
    } else {
      const stateDoc = await State.findOne({ name: { $regex: `^${state.trim()}$`, $options: 'i' } });
      if (stateDoc) filter.state = stateDoc._id;
      else filter.state = new mongoose.Types.ObjectId(); // force no matches if not found
    }
  }

  if (district) {
    if (mongoose.Types.ObjectId.isValid(district)) {
      filter.district = district;
    } else {
      // Find district within the matched state if state is filtered, or just by name
      const distFilter = { name: { $regex: `^${district.trim()}$`, $options: 'i' } };
      if (filter.state) distFilter.state = filter.state;

      const distDoc = await District.findOne(distFilter);
      if (distDoc) filter.district = distDoc._id;
      else filter.district = new mongoose.Types.ObjectId(); // force no matches
    }
  }

  return filter;
};

/**
 * GET /api/v1/colleges
 * Returns colleges matching state/district filters, sorted alphabetically
 */
const listColleges = async (req, res, next) => {
  try {
    if (!req.query.state && !req.query.district) {
      return res.status(400).json({
        success: false,
        message: 'State or District query parameter is required. To fetch details of a specific college, use GET /api/v1/colleges/:id.'
      });
    }

    const filter = await buildCollegeFilter(req.query);

    const colleges = await College.find(filter)
      .sort({ name: 1 })
      .populate('state', 'name')
      .populate('district', 'name')
      .populate('university', 'name');

    res.json({ success: true, colleges });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/colleges/states
 * Returns all unique state names (for backward compatibility)
 */
const getStates = async (req, res, next) => {
  try {
    const states = await State.find({}).sort({ name: 1 }).select('name');
    const stateNames = states.map((s) => s.name);
    res.json({ success: true, states: stateNames });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/colleges/districts?state=Maharashtra
 * Returns all unique district names in a given state (for backward compatibility)
 */
const getDistricts = async (req, res, next) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ success: false, message: 'State query param is required' });
    }

    let stateFilter = {};
    if (mongoose.Types.ObjectId.isValid(state)) {
      stateFilter = { _id: state };
    } else {
      stateFilter = { name: { $regex: `^${state.trim()}$`, $options: 'i' } };
    }

    const stateDoc = await State.findOne(stateFilter);
    if (!stateDoc) {
      return res.json({ success: true, districts: [] });
    }

    const districts = await District.find({ state: stateDoc._id }).sort({ name: 1 }).select('name');
    const districtNames = districts.map((d) => d.name);
    res.json({ success: true, districts: districtNames });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/colleges/search?q=Bombay&state=Maharashtra
 * Autocomplete matching query, filtered by state/district
 */
const searchColleges = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query param q is required' });
    }

    const filter = await buildCollegeFilter(req.query);

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Search by name or shortName (regex search for snappy autocomplete)
    filter.$or = [
      { name: { $regex: escapedQ, $options: 'i' } },
      { shortName: { $regex: escapedQ, $options: 'i' } },
    ];

    const colleges = await College.find(filter)
      .limit(30)
      .sort({ name: 1 })
      .populate('state', 'name')
      .populate('district', 'name')
      .populate('university', 'name');

    res.json({ success: true, colleges });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/colleges
 * Allows students to dynamically add their college if missing
 */
const createCollege = async (req, res, next) => {
  try {
    const { name, state, district, city, university, emailDomain, type } = req.body;

    if (!name || !state || !district || !city) {
      return res.status(400).json({
        success: false,
        message: 'College Name, State, District, and City are required.',
      });
    }

    // Resolve state
    let stateDoc;
    if (mongoose.Types.ObjectId.isValid(state)) {
      stateDoc = await State.findById(state);
    } else {
      stateDoc = await State.findOne({ name: { $regex: `^${state.trim()}$`, $options: 'i' } });
    }

    if (!stateDoc) {
      return res.status(400).json({ success: false, message: `State '${state}' not found.` });
    }

    // Resolve district
    let districtDoc;
    if (mongoose.Types.ObjectId.isValid(district)) {
      districtDoc = await District.findById(district);
    } else {
      districtDoc = await District.findOne({
        name: { $regex: `^${district.trim()}$`, $options: 'i' },
        state: stateDoc._id,
      });
    }

    if (!districtDoc) {
      return res.status(400).json({ success: false, message: `District '${district}' not found in state '${stateDoc.name}'.` });
    }

    // Resolve university (optional)
    let uniDoc = null;
    if (university) {
      if (mongoose.Types.ObjectId.isValid(university)) {
        uniDoc = await University.findById(university);
      } else {
        uniDoc = await University.findOne({ name: { $regex: `^${university.trim()}$`, $options: 'i' } });
        // If not found, dynamically create this University in the database
        if (!uniDoc) {
          uniDoc = await University.create({
            name: university.trim(),
            state: stateDoc._id,
            district: districtDoc._id,
            city: city.trim(),
          });
        }
      }
    }

    // Check if college with same name already exists in this district
    const existing = await College.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      state: stateDoc._id,
      district: districtDoc._id,
    });

    if (existing) {
      await existing.populate('state', 'name');
      await existing.populate('district', 'name');
      await existing.populate('university', 'name');
      return res.status(400).json({
        success: false,
        message: 'This college already exists in this district.',
        college: existing,
      });
    }

    const college = await College.create({
      name: name.trim(),
      state: stateDoc._id,
      district: districtDoc._id,
      city: city.trim(),
      university: uniDoc ? uniDoc._id : null,
      emailDomain: emailDomain ? emailDomain.trim().toLowerCase() : '',
      type: type || '',
    });

    await college.populate('state', 'name');
    await college.populate('district', 'name');
    await college.populate('university', 'name');

    res.status(201).json({
      success: true,
      college,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/colleges/detect?email=arjun@iitb.ac.in
 * Detect college from email domain
 */
const detectCollegeFromEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query param is required.' });
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const college = await College.findOne({ emailDomain: domain })
      .populate('state', 'name')
      .populate('district', 'name')
      .populate('university', 'name');

    if (!college) {
      return res.json({ success: true, college: null });
    }

    res.json({ success: true, college });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/colleges/:id
 * Returns a single college by ID
 */
const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID format.' });
    }

    const college = await College.findById(id)
      .populate('state', 'name')
      .populate('district', 'name')
      .populate('university', 'name');

    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    res.json({ success: true, college });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listColleges,
  getStates,
  getDistricts,
  searchColleges,
  createCollege,
  detectCollegeFromEmail,
  getCollegeById,
};
