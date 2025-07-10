const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Announcement = require('../models/Announcement');

// @desc    Create announcement
// @route   POST /api/announcements
router.post('/', async (req, res) => {
  const announcement = new Announcement({
    ...req.body,
    author: req.user.id
  });
  await announcement.save();
  res.status(201).json(announcement);
});

// @desc    Get active announcements
// @route   GET /api/announcements
router.get('/', async (req, res) => {
  const announcements = await Announcement.find({
    expiresAt: { $gt: new Date() }
  }).sort('-createdAt');
  res.json(announcements);
});

module.exports = router;