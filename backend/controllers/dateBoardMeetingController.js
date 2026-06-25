const DateBoardMeeting = require('../models/DateBoardMeeting');
const Suc = require('../models/Suc');
const { logActivity } = require('../utils/activityLogger');

// GET — superadmin sees all, admin sees their SUCs, user sees their own SUC
exports.getAll = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'admin' && req.user.occCode) {
      const sucs = await Suc.find({ occCode: req.user.occCode }).select('abbreviation');
      const abbrs = sucs.map((s) => s.abbreviation);
      filter.sucAbbreviation = { $in: abbrs };
    } else if (req.user.role === 'user' && req.user.sucAbbreviation) {
      filter.sucAbbreviation = req.user.sucAbbreviation;
    }
    const records = await DateBoardMeeting.find(filter).sort({ meetingDate: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST — admin or above
exports.create = async (req, res) => {
  try {
    const { sucAbbreviation, sucName, meetingDate, meetingTime, title, notes, meetingType, location } = req.body;
    if (!sucAbbreviation || !meetingDate) {
      return res.status(400).json({ message: 'sucAbbreviation and meetingDate are required' });
    }
    const record = await DateBoardMeeting.create({
      sucAbbreviation,
      sucName: sucName || '',
      meetingDate,
      meetingTime: meetingTime || '',
      title: title || 'Board Meeting',
      notes: notes || '',
      meetingType: meetingType || '',
      location: location || '',
      setBy: req.user.username || req.user.fullname || '',
    });
    logActivity(req, 'CREATE_MEETING', `Created board meeting reminder for ${sucAbbreviation} (${sucName || 'SUC'}) scheduled on ${meetingDate}`);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT — admin/above can update all fields; user can update only their own SUC's date+notes
exports.update = async (req, res) => {
  try {
    const record = await DateBoardMeeting.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'user') {
      if (record.sucAbbreviation !== req.user.sucAbbreviation) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const { meetingDate, meetingTime, notes } = req.body;
      Object.assign(record, {
        ...(meetingDate && { meetingDate }),
        ...(meetingTime !== undefined && { meetingTime }),
        ...(notes !== undefined && { notes }),
      });
      await record.save();
      logActivity(req, 'UPDATE_MEETING', `Updated board meeting reminder for ${record.sucAbbreviation} (${record.sucName || 'SUC'})`);
      return res.json(record);
    }

    const { sucAbbreviation, sucName, meetingDate, meetingTime, title, notes, meetingType, location } = req.body;
    Object.assign(record, {
      ...(sucAbbreviation && { sucAbbreviation }),
      ...(sucName !== undefined && { sucName }),
      ...(meetingDate && { meetingDate }),
      ...(meetingTime !== undefined && { meetingTime }),
      ...(title !== undefined && { title }),
      ...(notes !== undefined && { notes }),
      ...(meetingType !== undefined && { meetingType }),
      ...(location !== undefined && { location }),
    });
    await record.save();
    logActivity(req, 'UPDATE_MEETING', `Updated board meeting reminder details for ${record.sucAbbreviation} (${record.sucName || 'SUC'})`);
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE — admin or above
exports.remove = async (req, res) => {
  try {
    const record = await DateBoardMeeting.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    logActivity(req, 'DELETE_MEETING', `Deleted board meeting reminder for ${record.sucAbbreviation} (${record.sucName || 'SUC'}) scheduled on ${record.meetingDate}`);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
