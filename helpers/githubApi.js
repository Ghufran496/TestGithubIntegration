const axios = require("axios");
const GithubIntegration = require("../models/githubIntegration");

async function githubRequest(endpoint, userId) {
  try {
    const integration = await GithubIntegration.findOne({ userId });
    if (!integration) {
      throw new Error("GitHub integration not found");
    }

    const response = await axios.get(`https://api.github.com${endpoint}`, {
      headers: {
        Authorization: `token ${integration.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error making GitHub request to ${endpoint}:`, error.message);
    if (error.response) {
      console.error("GitHub API Response Status:", error.response.status);
      console.error("GitHub API Response Data:", error.response.data);
    }
    throw error;
  }
}

module.exports = {
  githubRequest,
};
