const ActivityLog = require('../models/ActivityLog');

exports.getActivityLogs = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'admin') {
      // Admin sees their own logs and all SUC users' logs under their OCC code
      filter = { occCode: req.user.occCode };
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(1000); // safety cap

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
