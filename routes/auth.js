const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');

const router = express.Router();

// Configure GitHub strategy
authController.configureGithubStrategy();

// GitHub authentication route
router.get('/github',
  passport.authenticate('github', { session: false })
);

// GitHub callback route
router.get('/github/callback', 
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:4200/auth/failure' }),
  authController.handleGithubCallback
);

// Check authentication status
router.get('/status', authController.checkAuthStatus);

// Remove integration
router.delete('/remove', authController.removeIntegration);

module.exports = router;