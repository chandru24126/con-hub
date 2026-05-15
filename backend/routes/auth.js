const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const constituencies = require('../data/constituencies');

// அனைத்து மாவட்டங்கள் பெறவும்
router.get('/districts', (req, res) => {
  const districts = constituencies.map(c => c.மாவட்டம்);
  res.json(districts);
});

// மாவட்டத்தின் தொகுதிகள் பெறவும்
router.get('/constituencies/:district', (req, res) => {
  const found = constituencies.find(c => c.மாவட்டம் === req.params.district);
  if (!found) return res.status(404).json({ செய்தி: 'மாவட்டம் கிடைக்கவில்லை' });
  res.json(found.தொகுதிகள்);
});

// பதிவு செய்யவும்
router.post('/register', async (req, res) => {
  try {
    const { பெயர், கைபேசி, கடவுச்சொல், மாவட்டம், தொகுதி } = req.body;
    const existing = await User.findOne({ கைபேசி });
    if (existing) return res.status(400).json({ செய்தி: 'இந்த கைபேசி எண் ஏற்கனவே பதிவாகியுள்ளது' });

    const user = new User({ பெயர், கைபேசி, கடவுச்சொல், மாவட்டம், தொகுதி });
    await user.save();

    const token = jwt.sign(
      { id: user._id, மாவட்டம்: user.மாவட்டம், தொகுதி: user.தொகுதி },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, பயனர்: { பெயர்: user.பெயர், மாவட்டம்: user.மாவட்டம், தொகுதி: user.தொகுதி } });
  } catch (err) {
    res.status(500).json({ செய்தி: 'சர்வர் பிழை', பிழை: err.message });
  }
});

// உள்நுழைவு
router.post('/login', async (req, res) => {
  try {
    const { கைபேசி, கடவுச்சொல் } = req.body;
    const user = await User.findOne({ கைபேசி });
    if (!user) return res.status(400).json({ செய்தி: 'பயனர் கிடைக்கவில்லை' });

    const isMatch = await user.கடவுச்சொல்_சரிபார்(கடவுச்சொல்);
    if (!isMatch) return res.status(400).json({ செய்தி: 'கடவுச்சொல் தவறானது' });

    const token = jwt.sign(
      { id: user._id, மாவட்டம்: user.மாவட்டம், தொகுதி: user.தொகுதி },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, பயனர்: { பெயர்: user.பெயர், மாவட்டம்: user.மாவட்டம், தொகுதி: user.தொகுதி } });
  } catch (err) {
    res.status(500).json({ செய்தி: 'சர்வர் பிழை' });
  }
});

module.exports = router;