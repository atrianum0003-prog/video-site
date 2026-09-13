const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  category:     { type: String, default: 'Other' },
  duration:     { type: String, default: '' },
  videoUrl:     { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  views:        { type: Number, default: 0 },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Video', videoSchema);