const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ensureAuth = require('../middleware/ensureAuth');

// Ruta protegida para contenido
router.get('/', ensureAuth, (req, res) => {
    res.render('content', { username: req.user.username });
});

module.exports = router;
