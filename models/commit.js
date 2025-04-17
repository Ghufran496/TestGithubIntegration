const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  sha: {
    type: String,
    required: true
  },
  message: String,
  authorName: String,
  authorEmail: String,
  date: Date,
  repositoryId: Number,
  organizationId: Number,
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Commit', commitSchema);