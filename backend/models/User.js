const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  பெயர்: { type: String, required: true },
  கைபேசி: { type: String, required: true, unique: true },
  கடவுச்சொல்: { type: String, required: true },
  மாவட்டம்: { type: String, required: true },
  தொகுதி: { type: String, required: true },
  உருவாக்கப்பட்டது: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('கடவுச்சொல்')) return next();
  this.கடவுச்சொல் = await bcrypt.hash(this.கடவுச்சொல், 10);
  next();
});

userSchema.methods.கடவுச்சொல்_சரிபார் = async function(கடவுச்சொல்) {
  return await bcrypt.compare(கடவுச்சொல், this.கடவுச்சொல்);
};

module.exports = mongoose.model('User', userSchema);