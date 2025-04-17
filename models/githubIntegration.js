const mongoose = require('mongoose');

const githubIntegrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSynced: {
    type: Date,
    default: Date.now
  },
  syncType: {
    type: String,
    default: 'full'
  }
});

module.exports = mongoose.model('GithubIntegration', githubIntegrationSchema);