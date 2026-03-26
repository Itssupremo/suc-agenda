const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
          { role: 'user', occCode: req.user.occCode },
        ],
      };
    }
    const users = await User.find(filter).select('-password').sort({ role: 1, fullname: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
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

    // admin: can only manage their own account or 'user' accounts under their own OCC code
    if (req.user.role === 'admin') {
      const isSelf = req.user._id.toString() === req.params.id;
      const isOwnOccUser = user.role === 'user' && user.occCode === req.user.occCode;
      if (!isSelf && !isOwnOccUser) {
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
    // admin cannot change role or occCode
    if (role && req.user.role === 'superadmin')           user.role = role;
    if (occCode !== undefined && req.user.role === 'superadmin') user.occCode = occCode;
    if (sucAbbreviation !== undefined) user.sucAbbreviation = sucAbbreviation;

    await user.save();
    const updated = user.toObject();
    delete updated.password;
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
    let effectiveRole = role || 'user';
    let effectiveOcc  = occCode || '';
    if (req.user.role === 'admin') {
      effectiveRole = 'user';
      effectiveOcc  = req.user.occCode;
    }

    const user = await User.create({
      fullname, username, password,
      email: email || '',
      role: effectiveRole,
      occCode: effectiveOcc,
      sucAbbreviation: sucAbbreviation || '',
    });
    const result = user.toObject();
    delete result.password;
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
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
