const mongoose = require('mongoose');

const sucSchema = new mongoose.Schema({
  sucName: { type: String, required: true, trim: true },
  abbreviation: { type: String, trim: true, default: '' },
  region: { type: String, required: true, trim: true },
  address: { type: String, trim: true, default: '' },
  president: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  contact: { type: String, trim: true, default: '' },
  boardSecretaryName: { type: String, trim: true, default: '' },
  boardSecretaryEmail: { type: String, trim: true, default: '' },
  boardSecretaryContact: { type: String, trim: true, default: '' },
  dateOfBoardMeeting: { type: String, trim: true, default: '' },
  chedOfficial: { type: String, trim: true, default: '' },
  occCode: { type: String, trim: true, default: '' },
  section: {
    type: String,
    enum: ['Chairperson', 'Commissioner', 'Other'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Suc', sucSchema);
