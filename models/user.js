const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  login: {
    type: String,
    required: true
  },
  name: String,
  avatarUrl: String,
  url: String,
  organizationId: Number,
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('GithubUser', userSchema);