const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Video = require('../models/Video');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

/* GET all videos (public) */
router.get('/', async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.json(videos);
});

/* GET one + increment views (public) */
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: 'Not found' });
    res.json(video);
  } catch {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

/* POST upload (admin only) */
router.post(
  '/',
  adminAuth,
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { title, description, category, duration } = req.body;
      if (!req.files?.video) return res.status(400).json({ error: 'Video file is required' });

      const videoResult = await uploadToCloudinary(
        req.files.video[0].buffer,
        { resource_type: 'video', folder: 'videos' }
      );

      let thumbnailUrl = videoResult.secure_url.replace(/\.[^.]+$/, '.jpg');

      if (req.files?.thumbnail) {
        const thumbResult = await uploadToCloudinary(
          req.files.thumbnail[0].buffer,
          { resource_type: 'image', folder: 'thumbnails' }
        );
        thumbnailUrl = thumbResult.secure_url;
      }

      const video = await Video.create({
        title, description, category, duration,
        videoUrl: videoResult.secure_url,
        thumbnailUrl,
      });

      res.status(201).json(video);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* DELETE (admin only) */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

module.exports = router;