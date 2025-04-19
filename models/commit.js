const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  sha: { type: String, required: true },
  message: { type: String, required: true },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  date: { type: Date, required: true },
  repositoryId: { type: Number, required: true },
  repositoryName: { type: String, required: true }, // Add repository name for easier access
  organizationId: { type: Number, required: true },
  userId: { type: String, required: true },
});

// Create a compound index for repository-specific queries
commitSchema.index({ repositoryId: 1, sha: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Commit', commitSchema);