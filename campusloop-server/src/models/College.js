const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District is required'],
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: [true, 'State is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
    },
    emailDomain: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['government', 'private', 'autonomous', 'other', ''],
      default: '',
    },
    logoUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes for fast querying & autocomplete
collegeSchema.index({ name: 'text', shortName: 'text' });
collegeSchema.index({ emailDomain: 1 });
collegeSchema.index({ state: 1, district: 1 });

// Automatically serialize populated references back to simple strings for backward-compatibility
collegeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.state && typeof ret.state === 'object') {
      ret.stateId = ret.state._id;
      if (ret.state.name) ret.state = ret.state.name;
    } else {
      ret.stateId = ret.state;
    }

    if (ret.district && typeof ret.district === 'object') {
      ret.districtId = ret.district._id;
      if (ret.district.name) ret.district = ret.district.name;
    } else {
      ret.districtId = ret.district;
    }

    if (ret.university && typeof ret.university === 'object') {
      ret.universityId = ret.university._id;
      if (ret.university.name) ret.university = ret.university.name;
    } else {
      ret.universityId = ret.university;
    }

    delete ret.id; // remove duplicate virtual id
    return ret;
  },
});

const College = mongoose.model('College', collegeSchema);
module.exports = College;
