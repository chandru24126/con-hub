const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB இணைக்கப்பட்டது'))
  .catch(err => console.log('MongoDB பிழை:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`சர்வர் ${PORT} போர்ட்டில் இயங்குகிறது`));