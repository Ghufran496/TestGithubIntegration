const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");

const router = express.Router();

authController.configureGithubStrategy();

router.get("/github", passport.authenticate("github", { session: false }));

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "http://localhost:4200/auth/failure",
  }),
  authController.handleGithubCallback
);

router.get("/status", authController.checkAuthStatus);

router.delete("/remove", authController.removeIntegration);

module.exports = router;
