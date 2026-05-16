const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'conhub',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, crop: 'limit' }]
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Image upload
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ செய்தி: 'படம் இல்லை' });
    res.json({ path: req.file.path });
  } catch (err) {
    res.status(500).json({ செய்தி: 'படம் பதிவேற்ற முடியவில்லை' });
  }
});

// Get problems
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find({ தொகுதி: req.user.தொகுதி }).lean();
    const sorted = problems.sort((a, b) => b.வாக்குகள்.length - a.வாக்குகள்.length);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ செய்தி: 'சர்வர் பிழை' });
  }
});

// Create problem
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, imagePath } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ செய்தி: 'தலைப்பு, விளக்கம், வகை கட்டாயம்' });
    }
    const problem = new Problem({
      தலைப்பு: title,
      விளக்கம்: description,
      வகை: category,
      படம்: imagePath || null,
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

// Vote
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

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ செய்தி: 'பிரச்னை கிடைக்கவில்லை' });
    if (problem.பயனர்.toString() !== req.user.id)
      return res.status(403).json({ செய்தி: 'உங்கள் பிரச்னையை மட்டுமே நீக்கலாம்' });
    if (problem.படம்) {
      const publicId = problem.படம்.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ செய்தி: 'பிரச்னை நீக்கப்பட்டது' });
  } catch (err) {
    res.status(500).json({ செய்தி: 'நீக்க முடியவில்லை' });
  }
});

module.exports = router;