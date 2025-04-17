const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: String,
  description: String,
  url: String,
  organizationId: Number,
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Repository', repositorySchema);