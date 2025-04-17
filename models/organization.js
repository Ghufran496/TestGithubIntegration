const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  url: String,
  avatarUrl: String,
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Organization', organizationSchema);