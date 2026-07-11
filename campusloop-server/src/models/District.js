const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: [true, 'State reference is required'],
    },
  },
  { timestamps: true }
);

// Indexes
districtSchema.index({ state: 1 });
districtSchema.index({ name: 1, state: 1 }, { unique: true }); // Ensure name uniqueness within a state

const District = mongoose.model('District', districtSchema);
module.exports = District;
