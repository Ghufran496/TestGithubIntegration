const express = require('express');
const githubController = require('../controllers/githubController');

const router = express.Router();

// Fetch and store organizations
router.get('/sync/organizations', githubController.syncOrganizations);

// Fetch and store repositories for an organization
router.get('/sync/repositories/:orgName', githubController.syncRepositories);

// Fetch and store commits for a repository
router.get('/sync/commits/:owner/:repo', githubController.syncCommits);

// Fetch and store pull requests for a repository
router.get('/sync/pulls/:owner/:repo', githubController.syncPulls);

// Fetch and store issues for a repository
router.get('/sync/issues/:owner/:repo', githubController.syncIssues);

// Fetch and store users for an organization
router.get('/sync/users/:orgName', githubController.syncUsers);

// Get all data for a specific collection
router.get('/data/:collection', githubController.getData);

// Get all collections for dropdown
router.get('/collections', githubController.getCollections);

// Fetch and store pull requests by repository ID
router.get('/sync/repository-pulls/:repoId', githubController.syncPullsByRepoId);

// Fetch and store issues by repository ID
router.get('/sync/repository-issues/:repoId', githubController.syncIssuesByRepoId);

module.exports = router;