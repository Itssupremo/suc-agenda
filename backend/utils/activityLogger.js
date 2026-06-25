const ActivityLog = require('../models/ActivityLog');

/**
 * Log activity when req.user is set
 */
const logActivity = async (req, action, details) => {
  try {
    if (!req || !req.user) return;
    const user = req.user;
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '';
    
    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      occCode: user.occCode || '',
      sucAbbreviation: user.sucAbbreviation || '',
      action,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

/**
 * Log activity when req.user is NOT set (e.g. login)
 */
const logActivityDirect = async (user, action, details, req) => {
  try {
    if (!user) return;
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '') : '';
    
    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      occCode: user.occCode || '',
      sucAbbreviation: user.sucAbbreviation || '',
      action,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Error logging direct activity:', error);
  }
};

module.exports = {
  logActivity,
  logActivityDirect
};
