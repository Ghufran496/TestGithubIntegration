const { githubRequest } = require('../helpers/githubApi');
const GithubIntegration = require('../models/githubIntegration');
const Organization = require('../models/organization');
const Repository = require('../models/repository');
const Commit = require('../models/commit');
const Pull = require('../models/pull');
const Issue = require('../models/issue');
const GithubUser = require('../models/user');

// Sync organizations
const syncOrganizations = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Fetch organizations from GitHub
        const orgs = await githubRequest('/user/orgs', userId);
        console.log(orgs, "orgsss");
        // Store organizations in database
        const savedOrgs = [];
        for (const org of orgs) {
            const orgDetails = await githubRequest(`/orgs/${org.login}`, userId);

            const savedOrg = await Organization.findOneAndUpdate(
                { id: org.id, userId },
                {
                    id: org.id,
                    name: org.login,
                    description: orgDetails.description || '',
                    url: org.url,
                    avatarUrl: org.avatar_url,
                    userId
                },
                { upsert: true, new: true }
            );

            savedOrgs.push(savedOrg);
        }

        // Update last synced time
        await GithubIntegration.findOneAndUpdate(
            { userId },
            { lastSynced: new Date() }
        );

        return res.status(200).json(savedOrgs);
    } catch (error) {
        console.error('Error syncing organizations:', error);
        return res.status(500).json({ error: 'Error syncing organizations' });
    }
};

// Sync repositories for an organization
const syncRepositories = async (req, res) => {
    try {
        const { orgName } = req.params;
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find organization
        const organization = await Organization.findOne({ name: orgName, userId });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Fetch repositories from GitHub
        const repos = await githubRequest(`/orgs/${orgName}/repos`, userId);

        // Store repositories in database
        const savedRepos = [];
        for (const repo of repos) {
            const savedRepo = await Repository.findOneAndUpdate(
                { id: repo.id, userId },
                {
                    id: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    description: repo.description || '',
                    url: repo.html_url,
                    organizationId: organization.id,
                    userId
                },
                { upsert: true, new: true }
            );

            savedRepos.push(savedRepo);
        }

        return res.status(200).json(savedRepos);
    } catch (error) {
        console.error('Error syncing repositories:', error);
        return res.status(500).json({ error: 'Error syncing repositories' });
    }
};

// Sync commits for a repository
const syncCommits = async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find repository
        const repository = await Repository.findOne({ fullName: `${owner}/${repo}`, userId });
        if (!repository) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        // Fetch commits from GitHub
        const commits = await githubRequest(`/repos/${owner}/${repo}/commits`, userId);

        // Store commits in database
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
                    userId
                },
                { upsert: true, new: true }
            );

            savedCommits.push(savedCommit);
        }

        return res.status(200).json(savedCommits);
    } catch (error) {
        console.error('Error syncing commits:', error);
        return res.status(500).json({ error: 'Error syncing commits' });
    }
};

// Sync pull requests for a repository
const syncPulls = async (req, res) => {

    try {
        const { owner, repo } = req.params;
        const userId = req.query.userId;
        console.log(owner, "ownerss");
        console.log(repo, "pullssss");

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find repository
        const repository = await Repository.findOne({ fullName: `${owner}/${repo}`, userId });
        if (!repository) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        // Fetch pull requests from GitHub
        const pulls = await githubRequest(`/repos/${owner}/${repo}/pulls`, userId);
        

        // Store pull requests in database
        const savedPulls = [];
        for (const pull of pulls) {
            const savedPull = await Pull.findOneAndUpdate(
                { id: pull.id, userId },
                {
                    id: pull.id,
                    title: pull.title,
                    body: pull.body || '',
                    state: pull.state,
                    createdAt: new Date(pull.created_at),
                    updatedAt: new Date(pull.updated_at),
                    number: pull.number,
                    repositoryId: repository.id,
                    organizationId: repository.organizationId,
                    userId
                },
                { upsert: true, new: true }
            );

            savedPulls.push(savedPull);
        }

        return res.status(200).json(savedPulls);
    } catch (error) {
        console.error('Error syncing pull requests:', error);
        return res.status(500).json({ error: 'Error syncing pull requests' });
    }
};

// Sync issues for a repository
const syncIssues = async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find repository
        const repository = await Repository.findOne({ fullName: `${owner}/${repo}`, userId });
        if (!repository) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        // Fetch issues from GitHub
        const issues = await githubRequest(`/repos/${owner}/${repo}/issues`, userId);

        // Store issues in database
        const savedIssues = [];
        for (const issue of issues) {
            // Skip pull requests (they also appear in the issues endpoint)
            if (issue.pull_request) continue;

            const savedIssue = await Issue.findOneAndUpdate(
                { id: issue.id, userId },
                {
                    id: issue.id,
                    title: issue.title,
                    body: issue.body || '',
                    state: issue.state,
                    createdAt: new Date(issue.created_at),
                    updatedAt: new Date(issue.updated_at),
                    number: issue.number,
                    repositoryId: repository.id,
                    organizationId: repository.organizationId,
                    userId
                },
                { upsert: true, new: true }
            );

            savedIssues.push(savedIssue);
        }

        return res.status(200).json(savedIssues);
    } catch (error) {
        console.error('Error syncing issues:', error);
        return res.status(500).json({ error: 'Error syncing issues' });
    }
};

// Sync users for an organization
const syncUsers = async (req, res) => {
    try {
        const { orgName } = req.params;
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find organization
        const organization = await Organization.findOne({ name: orgName, userId });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Fetch users from GitHub
        const users = await githubRequest(`/orgs/${orgName}/members`, userId);

        // Store users in database
        const savedUsers = [];
        for (const user of users) {
            const userDetails = await githubRequest(`/users/${user.login}`, userId);

            const savedUser = await GithubUser.findOneAndUpdate(
                { id: user.id, userId },
                {
                    id: user.id,
                    login: user.login,
                    name: userDetails.name || '',
                    avatarUrl: user.avatar_url,
                    url: user.html_url,
                    organizationId: organization.id,
                    userId
                },
                { upsert: true, new: true }
            );

            savedUsers.push(savedUser);
        }

        return res.status(200).json(savedUsers);
    } catch (error) {
        console.error('Error syncing users:', error);
        return res.status(500).json({ error: 'Error syncing users' });
    }
};

// Get data for a specific collection
const getData = async (req, res) => {
    try {
        const { collection } = req.params;
        const userId = req.query.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        let model;
        switch (collection) {
            case 'organizations':
                model = Organization;
                break;
            case 'repositories':
                model = Repository;
                break;
            case 'commits':
                model = Commit;
                break;
            case 'pulls':
                model = Pull;
                break;
            case 'issues':
                model = Issue;
                break;
            case 'users':
                model = GithubUser;
                break;
            default:
                return res.status(400).json({ error: 'Invalid collection' });
        }

        // Build search query
        let query = { userId };
        if (search) {
            // Create a regex search across all string fields
            const searchRegex = new RegExp(search, 'i');
            const searchQuery = [];

            // Get all string fields from the model schema
            const stringFields = Object.keys(model.schema.paths).filter(path => {
                const schemaType = model.schema.paths[path];
                return schemaType.instance === 'String';
            });

            // Add each string field to the search query
            stringFields.forEach(field => {
                const fieldQuery = {};
                fieldQuery[field] = searchRegex;
                searchQuery.push(fieldQuery);
            });

            if (searchQuery.length > 0) {
                query.$or = searchQuery;
            }
        }

        // Get total count for pagination
        const total = await model.countDocuments(query);

        // Get data with pagination
        const data = await model.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ _id: -1 });

        return res.status(200).json({
            data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Error fetching data' });
    }
};

// Get all collections for dropdown
const getCollections = (req, res) => {
    const collections = [
        { value: 'organizations', label: 'Organizations' },
        { value: 'repositories', label: 'Repositories' },
        { value: 'commits', label: 'Commits' },
        { value: 'pulls', label: 'Pull Requests' },
        { value: 'issues', label: 'Issues' },
        { value: 'users', label: 'Users' }
    ];

    return res.status(200).json(collections);
};

module.exports = {
    syncOrganizations,
    syncRepositories,
    syncCommits,
    syncPulls,
    syncIssues,
    syncUsers,
    getData,
    getCollections
};