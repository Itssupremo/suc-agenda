const mongoose = require('mongoose');

const dateBoardMeetingSchema = new mongoose.Schema({
  sucAbbreviation: { type: String, required: true, trim: true },
  sucName:         { type: String, trim: true, default: '' },
  meetingDate:     { type: String, required: true, trim: true }, // YYYY-MM-DD
  title:           { type: String, trim: true, default: 'Board Meeting' },
  notes:           { type: String, trim: true, default: '' },
  setBy:           { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DateBoardMeeting', dateBoardMeetingSchema);
