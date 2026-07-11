const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'State name is required'],
      unique: true,
      trim: true,
    },
    isUnionTerritory: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for sorting and search performance
stateSchema.index({ name: 1 });

const State = mongoose.model('State', stateSchema);
module.exports = State;
