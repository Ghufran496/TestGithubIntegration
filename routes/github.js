const express = require("express");
const githubController = require("../controllers/githubController");

const router = express.Router();

router.get("/sync/organizations", githubController.syncOrganizations);

router.get("/sync/repositories/:orgName", githubController.syncRepositories);

router.get("/sync/commits/:owner/:repo", githubController.syncCommits);

router.get("/sync/pulls/:owner/:repo", githubController.syncPulls);

router.get("/sync/issues/:owner/:repo", githubController.syncIssues);

router.get("/sync/users/:orgName", githubController.syncUsers);

router.get("/data/:collection", githubController.getData);

router.get("/collections", githubController.getCollections);

router.get(
  "/sync/repository-pulls/:repoId",
  githubController.syncPullsByRepoId
);

router.get(
  "/sync/repository-issues/:repoId",
  githubController.syncIssuesByRepoId
);

module.exports = router;
