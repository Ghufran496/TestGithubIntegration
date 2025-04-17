const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: String,
  body: String,
  state: String,
  createdAt: Date,
  updatedAt: Date,
  number: Number,
  repositoryId: Number,
  organizationId: Number,
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Issue', issueSchema);