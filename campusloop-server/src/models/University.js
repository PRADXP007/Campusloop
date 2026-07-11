const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'University name is required'],
      unique: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true,
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

universitySchema.index({ name: 'text', shortName: 'text' });
universitySchema.index({ state: 1 });

const University = mongoose.model('University', universitySchema);
module.exports = University;
