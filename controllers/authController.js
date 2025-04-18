const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GithubIntegration = require('../models/githubIntegration');

// Configure GitHub strategy
const configureGithubStrategy = () => {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/github/callback",
    scope: ['user', 'repo', 'admin:org']
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Check if integration already exists
      let integration = await GithubIntegration.findOne({ userId: profile.id });
      
      if (integration) {
        // Update existing integration
        integration.accessToken = accessToken;
        integration.lastSynced = new Date();
        await integration.save();
      } else {
        // Create new integration
        integration = new GithubIntegration({
          userId: profile.id,
          accessToken: accessToken,
          username: profile.username,
          connectedAt: new Date(),
          lastSynced: new Date()
        });
        await integration.save();
      }
      
      return done(null, { 
        id: profile.id, 
        username: profile.username,
        accessToken: accessToken 
      });
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  // Deserialize user
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });
};

// Check authentication status
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
      syncType: integration.syncType
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle GitHub callback
const handleGithubCallback = async (req, res) => {
  try {
    // User is authenticated and available in req.user
    const token = req.user.accessToken;
    const userId = req.user.id;
    
    // Redirect to frontend with token and userId
    res.redirect(`http://localhost:4200/auth/success?token=${token}&userId=${userId}`);
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.redirect('http://localhost:4200/auth/failure');
  }
};

// Remove integration
const removeIntegration = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    await GithubIntegration.findOneAndDelete({ userId });
    
    return res.status(200).json({ message: 'Integration removed successfully' });
  } catch (error) {
    console.error('Error removing integration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  configureGithubStrategy,
  checkAuthStatus,
  handleGithubCallback,
  removeIntegration
};