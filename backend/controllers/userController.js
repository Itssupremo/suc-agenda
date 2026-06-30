const User = require('../models/User');
const Suc = require('../models/Suc');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/activityLogger');

// GET all users
// superadmin → all users
// admin       → their own account + 'user' accounts under their own OCC code
exports.getAllUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'admin') {
      filter = {
        $or: [
          { _id: req.user._id },
          { role: { $in: ['user', 'board_member'] }, occCode: req.user.occCode },
        ],
      };
    } else if (req.user.role === 'user') {
      filter = {
        role: 'board_member',
        sucAbbreviation: req.user.sucAbbreviation,
      };
    }
    const users = await User.find(filter).select('-password').sort({ role: 1, fullname: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getOccCodeForSuc = async (sucAbbreviation) => {
  if (!sucAbbreviation) return '';
  const sucDoc = await Suc.findOne({ abbreviation: new RegExp(`^${sucAbbreviation.trim()}$`, 'i') });
  return sucDoc ? sucDoc.occCode : '';
};

// PUT /api/users/me — self-update (any authenticated user: email, username, password only)
exports.updateSelf = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }
    if (email !== undefined) user.email = email;
    if (password) user.password = password;

    await user.save();
    const updated = user.toObject();
    delete updated.password;
    logActivity(req, 'UPDATE_USER_SELF', 'User updated their own profile settings');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT update user
exports.updateUser = async (req, res) => {
  try {
    const { fullname, username, password, email, role, occCode, sucAbbreviation } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // admin: can only manage their own account or 'user' / 'board_member' accounts under their own OCC code
    if (req.user.role === 'admin') {
      const isSelf = req.user._id.toString() === req.params.id;
      const isOwnOccUser = ['user', 'board_member'].includes(user.role) && user.occCode === req.user.occCode;
      if (!isSelf && !isOwnOccUser) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'user') {
      const isOwnSucUser = user.role === 'board_member' && user.sucAbbreviation === req.user.sucAbbreviation;
      if (!isOwnSucUser) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (req.user._id.toString() === req.params.id && role && role !== user.role) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }

    if (fullname)                 user.fullname = fullname;
    if (email !== undefined)       user.email = email;
    if (password)                  user.password = password;
    
    // admin / superadmin field update and auto OCC assignment
    if (req.user.role === 'superadmin') {
      if (role) user.role = role;
      if (occCode !== undefined) user.occCode = occCode;
      if (sucAbbreviation !== undefined) {
        user.sucAbbreviation = sucAbbreviation;
        if (sucAbbreviation) {
          const matchedOcc = await getOccCodeForSuc(sucAbbreviation);
          if (matchedOcc) user.occCode = matchedOcc;
        }
      }
    } else if (req.user.role === 'admin') {
      if (sucAbbreviation !== undefined) {
        user.sucAbbreviation = sucAbbreviation;
        if (sucAbbreviation) {
          const matchedOcc = await getOccCodeForSuc(sucAbbreviation);
          if (matchedOcc) {
            if (matchedOcc !== req.user.occCode) {
              return res.status(403).json({ message: `Access denied: SUC "${sucAbbreviation}" is not under your OCC` });
            }
            user.occCode = matchedOcc;
          }
        }
      }
    }

    await user.save();
    const updated = user.toObject();
    delete updated.password;
    logActivity(req, 'UPDATE_USER', `Updated user account: ${user.username} (Fullname: ${user.fullname}, Role: ${user.role})`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create user
exports.createUser = async (req, res) => {
  try {
    const { fullname, username, password, email, role, occCode, sucAbbreviation } = req.body;
    if (!fullname || !username || !password) {
      return res.status(400).json({ message: 'Fullname, username, and password are required' });
    }
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already taken' });

    // admin: can only create 'user' accounts under their own OCC code
    // user: can only create 'board_member' accounts under their own SUC
    let effectiveRole = role || 'user';
    let effectiveOcc  = occCode || '';
    let effectiveSuc  = sucAbbreviation || '';
    if (req.user.role === 'admin') {
      effectiveRole = 'user';
      effectiveSuc  = sucAbbreviation || '';
      if (effectiveSuc) {
        const matchedOcc = await getOccCodeForSuc(effectiveSuc);
        if (matchedOcc !== req.user.occCode) {
          return res.status(403).json({ message: `Access denied: SUC "${effectiveSuc}" is not under your OCC` });
        }
        effectiveOcc = matchedOcc;
      } else {
        effectiveOcc = req.user.occCode;
      }
    } else if (req.user.role === 'user') {
      effectiveRole = 'board_member';
      effectiveSuc  = req.user.sucAbbreviation;
      effectiveOcc  = await getOccCodeForSuc(effectiveSuc);
    } else if (req.user.role === 'superadmin') {
      effectiveSuc  = sucAbbreviation || '';
      if (effectiveSuc) {
        effectiveOcc = await getOccCodeForSuc(effectiveSuc);
      }
    }
 
    const user = await User.create({
      fullname, username, password,
      email: email || '',
      role: effectiveRole,
      occCode: effectiveOcc,
      sucAbbreviation: effectiveSuc,
    });
    const result = user.toObject();
    delete result.password;
    logActivity(req, 'CREATE_USER', `Created user account: ${user.username} (Fullname: ${user.fullname}, Role: ${user.role})`);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // admin: cannot delete superadmin, other admins, or users outside their OCC; cannot delete self
    if (req.user.role === 'admin') {
      const isOwnOccUser = user.role === 'user' && user.occCode === req.user.occCode;
      if (!isOwnOccUser) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'user') {
      const isOwnSucUser = user.role === 'board_member' && user.sucAbbreviation === req.user.sucAbbreviation;
      if (!isOwnSucUser) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    logActivity(req, 'DELETE_USER', `Deleted user account: ${user.username} (Fullname: ${user.fullname}, Role: ${user.role})`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
