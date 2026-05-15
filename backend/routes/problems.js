const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// தொகுதி பிரச்னைகள் பெறவும் — வாக்கு எண்ணிக்கை அதிகம் முதல்
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find({ தொகுதி: req.user.தொகுதி }).lean();
    const sorted = problems.sort((a, b) => b.வாக்குகள்.length - a.வாக்குகள்.length);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ செய்தி: 'சர்வர் பிழை' });
  }
});

// புதிய பிரச்னை உருவாக்கவும்
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ செய்தி: 'தலைப்பு, விளக்கம், வகை கட்டாயம்' });
    }
    const problem = new Problem({
      தலைப்பு: title,
      விளக்கம்: description,
      வகை: category,
      படம்: req.file ? `/uploads/${req.file.filename}` : null,
      மாவட்டம்: req.user.மாவட்டம்,
      தொகுதி: req.user.தொகுதி,
      பயனர்: req.user.id
    });
    await problem.save();
    res.json(problem);
  } catch (err) {
    res.status(500).json({ செய்தி: 'பிரச்னை சேர்க்க முடியவில்லை', பிழை: err.message });
  }
});

// வாக்களிக்கவும்
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ செய்தி: 'பிரச்னை கிடைக்கவில்லை' });
    if (problem.தொகுதி !== req.user.தொகுதி)
      return res.status(403).json({ செய்தி: 'உங்கள் தொகுதியில் மட்டுமே வாக்களிக்கலாம்' });

    const userId = req.user.id;
    const alreadyVoted = problem.வாக்குகள்.map(id => id.toString()).includes(userId);

    if (alreadyVoted) {
      problem.வாக்குகள் = problem.வாக்குகள்.filter(id => id.toString() !== userId);
    } else {
      problem.வாக்குகள்.push(userId);
    }

    await problem.save();
    res.json({ வாக்குகள்: problem.வாக்குகள்.length, வாக்களித்தீர்கள்: !alreadyVoted });
  } catch (err) {
    res.status(500).json({ செய்தி: 'வாக்களிக்க முடியவில்லை' });
  }
});

// பிரச்னை நீக்கவும்
router.delete('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ செய்தி: 'பிரச்னை கிடைக்கவில்லை' });
    if (problem.பயனர்.toString() !== req.user.id)
      return res.status(403).json({ செய்தி: 'உங்கள் பிரச்னையை மட்டுமே நீக்கலாம்' });
    if (problem.படம்) {
      const filePath = path.join(__dirname, '..', problem.படம்);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ செய்தி: 'பிரச்னை நீக்கப்பட்டது' });
  } catch (err) {
    res.status(500).json({ செய்தி: 'நீக்க முடியவில்லை' });
  }
});

module.exports = router;