const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    // Successful authentication, redirect to the app
    res.redirect('/');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture
      }
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null
  });
});

module.exports = router;
