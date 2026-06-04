require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 2. Define the Database Structure (Matches your old JSON file exactly)
const DataSchema = new mongoose.Schema({
  users: Array,
  bugs: Array,
  milestones: Array,
  games: Array,
  activity: Array
}, { strict: false }); 

const KaosData = mongoose.model('KaosData', DataSchema);

// 3. API ENDPOINTS

// GET: Send data to your frontend
app.get('/api/data', async (req, res) => {
  try {
    let data = await KaosData.findOne();
    if (!data) {
      // Auto-create empty database on first boot
      data = await KaosData.create({ users: [], bugs: [], milestones: [], games: [], activity: [] });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database" });
  }
});

// PUT: Receive and save data from frontend
app.put('/api/data', async (req, res) => {
  try {
    let data = await KaosData.findOne();
    if (data) {
      await KaosData.updateOne({ _id: data._id }, req.body);
    } else {
      await KaosData.create(req.body);
    }
    res.json({ success: true, message: "Data saved securely to MongoDB!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to write database" });
  }
});

// 4. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 KaOS Server running on port ${PORT}`));