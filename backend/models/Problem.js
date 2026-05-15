const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  தலைப்பு: { type: String, required: true },
  விளக்கம்: { type: String, required: true },
  வகை: {
    type: String,
    enum: ['சாலை', 'குடிநீர்', 'மின்சாரம்', 'சுகாதாரம்', 'பாதுகாப்பு', 'கல்வி', 'மற்றவை'],
    required: true
  },
  படம்: { type: String },
  மாவட்டம்: { type: String, required: true },
  தொகுதி: { type: String, required: true },
  பயனர்: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  வாக்குகள்: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  நிலை: {
    type: String,
    enum: ['நிலுவையில்', 'செயலில்', 'தீர்க்கப்பட்டது'],
    default: 'நிலுவையில்'
  },
  உருவாக்கப்பட்டது: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Problem', problemSchema);








