const DateBoardMeeting = require('../models/DateBoardMeeting');
const Suc = require('../models/Suc');

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
    const { sucAbbreviation, sucName, meetingDate, title, notes } = req.body;
    if (!sucAbbreviation || !meetingDate) {
      return res.status(400).json({ message: 'sucAbbreviation and meetingDate are required' });
    }
    const record = await DateBoardMeeting.create({
      sucAbbreviation,
      sucName: sucName || '',
      meetingDate,
      title: title || 'Board Meeting',
      notes: notes || '',
      setBy: req.user.username || req.user.fullname || '',
    });
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
      const { meetingDate, notes } = req.body;
      Object.assign(record, {
        ...(meetingDate && { meetingDate }),
        ...(notes !== undefined && { notes }),
      });
      await record.save();
      return res.json(record);
    }

    const { sucAbbreviation, sucName, meetingDate, title, notes } = req.body;
    Object.assign(record, {
      ...(sucAbbreviation && { sucAbbreviation }),
      ...(sucName !== undefined && { sucName }),
      ...(meetingDate && { meetingDate }),
      ...(title !== undefined && { title }),
      ...(notes !== undefined && { notes }),
    });
    await record.save();
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
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
