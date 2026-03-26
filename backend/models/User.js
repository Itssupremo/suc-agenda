const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:         { type: String, required: true, unique: true, trim: true },
  password:         { type: String, required: true },
  email:            { type: String, trim: true, default: '' },
  fullname:         { type: String, required: true, trim: true },
  role:             { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  occCode:          { type: String, trim: true, default: '' },  // for admin (commissioner)
  sucAbbreviation:  { type: String, trim: true, default: '' },  // for user (SUC)
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
