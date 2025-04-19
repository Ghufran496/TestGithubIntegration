const { githubRequest } = require("../helpers/githubApi");
const GithubIntegration = require("../models/githubIntegration");
const Organization = require("../models/organization");
const Repository = require("../models/repository");
const Commit = require("../models/commit");
const Pull = require("../models/pull");
const Issue = require("../models/issue");
const GithubUser = require("../models/user");

const syncOrganizations = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const orgs = await githubRequest("/user/orgs", userId);
    const savedOrgs = [];
    for (const org of orgs) {
      const orgDetails = await githubRequest(`/orgs/${org.login}`, userId);

      const savedOrg = await Organization.findOneAndUpdate(
        { id: org.id, userId },
        {
          id: org.id,
          name: org.login,
          description: orgDetails.description || "",
          url: org.url,
          avatarUrl: org.avatar_url,
          userId,
        },
        { upsert: true, new: true }
      );

      savedOrgs.push(savedOrg);
    }

    await GithubIntegration.findOneAndUpdate(
      { userId },
      { lastSynced: new Date() }
    );

    return res.status(200).json(savedOrgs);
  } catch (error) {
    console.error("Error syncing organizations:", error);
    return res.status(500).json({ error: "Error syncing organizations" });
  }
};

const syncRepositories = async (req, res) => {
  try {
    const { orgName } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const organization = await Organization.findOne({ name: orgName, userId });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const repos = await githubRequest(`/orgs/${orgName}/repos`, userId);

    const savedRepos = [];
    for (const repo of repos) {
      const savedRepo = await Repository.findOneAndUpdate(
        { id: repo.id, userId },
        {
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || "",
          url: repo.html_url,
          organizationId: organization.id,
          userId,
        },
        { upsert: true, new: true }
      );

      savedRepos.push(savedRepo);
    }

    return res.status(200).json(savedRepos);
  } catch (error) {
    console.error("Error syncing repositories:", error);
    return res.status(500).json({ error: "Error syncing repositories" });
  }
};

const syncCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const repository = await Repository.findOne({
      fullName: `${owner}/${repo}`,
      userId,
    });
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const commits = await githubRequest(
      `/repos/${owner}/${repo}/commits`,
      userId
    );

    // If no commits found
    if (!commits || commits.length === 0) {
      return res.status(200).json({ 
        message: "Repository is empty (no commits yet)",
        data: []
      });
    }

    const savedCommits = [];
    for (const commit of commits) {
      const savedCommit = await Commit.findOneAndUpdate(
        { sha: commit.sha, repositoryId: repository.id, userId },
        {
          sha: commit.sha,
          message: commit.commit.message,
          authorName: commit.commit.author.name,
          authorEmail: commit.commit.author.email,
          date: new Date(commit.commit.author.date),
          repositoryId: repository.id,
          repositoryName: repository.fullName, // Store repository name
          organizationId: repository.organizationId,
          userId,
        },
        { upsert: true, new: true }
      );

      savedCommits.push(savedCommit);
    }

    return res.status(200).json(savedCommits);
  } catch (error) {
    console.error("Error syncing commits:", error);
    return res.status(500).json({ error: "Error syncing commits" });
  }
};

const syncPulls = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const userId = req.query.userId;
    console.log(owner, "ownerss");
    console.log(repo, "pullssss");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const repository = await Repository.findOne({
      fullName: `${owner}/${repo}`,
      userId,
    });
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const pulls = await githubRequest(`/repos/${owner}/${repo}/pulls`, userId);

    const savedPulls = [];
    for (const pull of pulls) {
      const savedPull = await Pull.findOneAndUpdate(
        { id: pull.id, userId },
        {
          id: pull.id,
          title: pull.title,
          body: pull.body || "",
          state: pull.state,
          createdAt: new Date(pull.created_at),
          updatedAt: new Date(pull.updated_at),
          number: pull.number,
          repositoryId: repository.id,
          organizationId: repository.organizationId,
          userId,
        },
        { upsert: true, new: true }
      );

      savedPulls.push(savedPull);
    }

    return res.status(200).json(savedPulls);
  } catch (error) {
    console.error("Error syncing pull requests:", error);
    return res.status(500).json({ error: "Error syncing pull requests" });
  }
};

const syncIssues = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const repository = await Repository.findOne({
      fullName: `${owner}/${repo}`,
      userId,
    });
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const issues = await githubRequest(
      `/repos/${owner}/${repo}/issues`,
      userId
    );

    const savedIssues = [];
    for (const issue of issues) {
      if (issue.pull_request) continue;

      const savedIssue = await Issue.findOneAndUpdate(
        { id: issue.id, userId },
        {
          id: issue.id,
          title: issue.title,
          body: issue.body || "",
          state: issue.state,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          number: issue.number,
          repositoryId: repository.id,
          organizationId: repository.organizationId,
          userId,
        },
        { upsert: true, new: true }
      );

      savedIssues.push(savedIssue);
    }

    return res.status(200).json(savedIssues);
  } catch (error) {
    console.error("Error syncing issues:", error);
    return res.status(500).json({ error: "Error syncing issues" });
  }
};

const syncUsers = async (req, res) => {
  try {
    const { orgName } = req.params;
    const userId = req.query.userId;
    console.log(orgName, "orgName");
    console.log(userId, "userid");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const organization = await Organization.findOne({ name: orgName, userId });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const users = await githubRequest(`/orgs/${orgName}/members`, userId);

    const savedUsers = [];
    for (const user of users) {
      const userDetails = await githubRequest(`/users/${user.login}`, userId);
      console.log(userDetails, "userDetails");

      const savedUser = await GithubUser.findOneAndUpdate(
        { id: user.id, userId },
        {
          id: user.id,
          login: user.login,
          name: userDetails.name || "",
          avatarUrl: user.avatar_url,
          url: user.html_url,
          organizationId: organization.id,
          userId,
        },
        { upsert: true, new: true }
      );

      savedUsers.push(savedUser);
    }

    return res.status(200).json(savedUsers);
  } catch (error) {
    console.error("Error syncing users:", error);
    return res.status(500).json({ error: "Error syncing users" });
  }
};

const getData = async (req, res) => {
  try {
    const { collection } = req.params;
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const repo = req.query.repo || "";

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let model;
    switch (collection) {
      case "organizations":
        model = Organization;
        break;
      case "repositories":
        model = Repository;
        break;
      case "commits":
        model = Commit;
        break;
      case "pulls":
      case "pull-requests":
        model = Pull;
        break;
      case "issues":
        model = Issue;
        break;
      case "users":
        model = GithubUser;
        break;
      default:
        return res.status(400).json({ error: "Invalid collection" });
    }

    let query = { userId };

    if (
      repo &&
      ["commits", "pulls", "pull-requests", "issues"].includes(collection)
    ) {
      if (collection === "commits") {
        // For commits, use the repositoryName field directly
        query.repositoryName = repo;
      } else {
        // For other collections, continue using the repository ID
        const repository = await Repository.findOne({ fullName: repo, userId });
        if (repository) {
          query.repositoryId = repository.id;
        }
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const searchQuery = [];

      const stringFields = Object.keys(model.schema.paths).filter((path) => {
        const schemaType = model.schema.paths[path];
        return schemaType.instance === "String";
      });

      stringFields.forEach((field) => {
        const fieldQuery = {};
        fieldQuery[field] = searchRegex;
        searchQuery.push(fieldQuery);
      });

      if (searchQuery.length > 0) {
        query.$or = searchQuery;
      }
    }

    const total = await model.countDocuments(query);

    const data = await model
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, _id: -1 });

    // For commits, group by repository in the response
    if (collection === "commits" && !repo) {
      // If no specific repo is selected, group commits by repository
      const groupedData = {};
      
      for (const commit of data) {
        const repoName = commit.repositoryName;
        if (!groupedData[repoName]) {
          groupedData[repoName] = [];
        }
        groupedData[repoName].push(commit);
      }
      
      return res.status(200).json({
        data: Object.keys(groupedData).map(repo => ({
          repository: repo,
          commits: groupedData[repo]
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    }

    return res.status(200).json({
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Error fetching data" });
  }
};

const getCollections = (req, res) => {
  const collections = [
    { value: "organizations", label: "Organizations" },
    { value: "repositories", label: "Repositories" },
    { value: "commits", label: "Commits" },
    { value: "pulls", label: "Pull Requests" },
    { value: "issues", label: "Issues" },
    { value: "users", label: "Users" },
  ];

  return res.status(200).json(collections);
};

const syncPullsByRepoId = async (req, res) => {
  try {
    const { repoId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const repository = await Repository.findOne({
      id: parseInt(repoId),
      userId,
    });
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const [owner, repo] = repository.fullName.split("/");

    const pulls = await githubRequest(`/repos/${owner}/${repo}/pulls`, userId);

    const savedPulls = [];
    for (const pull of pulls) {
      const savedPull = await Pull.findOneAndUpdate(
        { id: pull.id, userId },
        {
          id: pull.id,
          title: pull.title,
          body: pull.body || "",
          state: pull.state,
          createdAt: new Date(pull.created_at),
          updatedAt: new Date(pull.updated_at),
          number: pull.number,
          repositoryId: repository.id,
          organizationId: repository.organizationId,
          userId,
        },
        { upsert: true, new: true }
      );

      savedPulls.push(savedPull);
    }

    return res.status(200).json(savedPulls);
  } catch (error) {
    console.error("Error syncing pull requests by repo ID:", error);
    return res.status(500).json({ error: "Error syncing pull requests" });
  }
};

const syncIssuesByRepoId = async (req, res) => {
  try {
    const { repoId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const repository = await Repository.findOne({
      id: parseInt(repoId),
      userId,
    });
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const [owner, repo] = repository.fullName.split("/");

    const issues = await githubRequest(
      `/repos/${owner}/${repo}/issues`,
      userId
    );

    const savedIssues = [];
    for (const issue of issues) {
      if (issue.pull_request) continue;

      const savedIssue = await Issue.findOneAndUpdate(
        { id: issue.id, userId },
        {
          id: issue.id,
          title: issue.title,
          body: issue.body || "",
          state: issue.state,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          number: issue.number,
          repositoryId: repository.id,
          organizationId: repository.organizationId,
          userId,
        },
        { upsert: true, new: true }
      );

      savedIssues.push(savedIssue);
    }

    return res.status(200).json(savedIssues);
  } catch (error) {
    console.error("Error syncing issues by repo ID:", error);
    return res.status(500).json({ error: "Error syncing issues" });
  }
};

const syncCommitsByRepoId = async (req, res) => {
  try {
    const { repoId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const repository = await Repository.findOne({
      id: parseInt(repoId),
      userId,
    });
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    const [owner, repo] = repository.fullName.split("/");

    const commits = await githubRequest(
      `/repos/${owner}/${repo}/commits`,
      userId
    );

    const savedCommits = [];
    for (const commit of commits) {
      const savedCommit = await Commit.findOneAndUpdate(
        { sha: commit.sha, userId },
        {
          sha: commit.sha,
          message: commit.commit.message,
          authorName: commit.commit.author.name,
          authorEmail: commit.commit.author.email,
          date: new Date(commit.commit.author.date),
          repositoryId: repository.id,
          organizationId: repository.organizationId,
          userId,
        },
        { upsert: true, new: true }
      );

      savedCommits.push(savedCommit);
    }

    return res.status(200).json(savedCommits);
  } catch (error) {
    console.error("Error syncing commits by repo ID:", error);
    return res.status(500).json({ error: "Error syncing commits" });
  }
};

module.exports = {
  syncOrganizations,
  syncRepositories,
  syncCommits,
  syncCommitsByRepoId,
  syncPulls,
  syncPullsByRepoId,
  syncIssues,
  syncIssuesByRepoId,
  syncUsers,
  getData,
  getCollections,
};
