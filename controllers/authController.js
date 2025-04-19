const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const GithubIntegration = require("../models/githubIntegration");

const configureGithubStrategy = () => {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/api/auth/github/callback",
        scope: ["user", "repo", "admin:org"],
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          let integration = await GithubIntegration.findOne({
            userId: profile.id,
          });
          if (integration) {
            integration.accessToken = accessToken;
            integration.lastSynced = new Date();
            await integration.save();
          } else {
            integration = new GithubIntegration({
              userId: profile.id,
              accessToken: accessToken,
              username: profile.username,
              connectedAt: new Date(),
              lastSynced: new Date(),
            });
            await integration.save();
          }

          return done(null, {
            id: profile.id,
            username: profile.username,
            accessToken: accessToken,
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
};

const checkAuthStatus = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ authenticated: false });
    }

    const integration = await GithubIntegration.findOne({ userId });
    if (!integration) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      username: integration.username,
      connectedAt: integration.connectedAt,
      lastSynced: integration.lastSynced,
      syncType: integration.syncType,
    });
  } catch (error) {
    console.error("Error checking auth status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const handleGithubCallback = async (req, res) => {
  try {
    const token = req.user.accessToken;
    const userId = req.user.id;

    res.redirect(
      `http://localhost:4200/auth/success?token=${token}&userId=${userId}`
    );
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.redirect("http://localhost:4200/auth/failure");
  }
};

const removeIntegration = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const Organization = require("../models/organization");
    const Repository = require("../models/repository");
    const Commit = require("../models/commit");
    const Pull = require("../models/pull");
    const Issue = require("../models/issue");
    const GithubUser = require("../models/user");

    await Promise.all([
      GithubIntegration.findOneAndDelete({ userId }),
      Organization.deleteMany({ userId }),
      Repository.deleteMany({ userId }),
      Commit.deleteMany({ userId }),
      Pull.deleteMany({ userId }),
      Issue.deleteMany({ userId }),
      GithubUser.deleteMany({ userId }),
    ]);

    return res
      .status(200)
      .json({
        message: "Integration and all associated data removed successfully",
      });
  } catch (error) {
    console.error("Error removing integration and data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  configureGithubStrategy,
  checkAuthStatus,
  handleGithubCallback,
  removeIntegration,
};
