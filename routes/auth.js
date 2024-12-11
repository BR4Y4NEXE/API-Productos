// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Ruta para la página de registro
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Ruta para procesar el registro
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.render('register', { error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar usuario');
    }
});

// Ruta para la página de login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Ruta para procesar el login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.render('login', { error: 'Credenciales incorrectas' });
        }

        // Guardar el ID del usuario en la sesión
        req.session.userId = user._id;
        res.redirect('/productos');  // Redirigir a productos (ruta protegida)
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al iniciar sesión');
    }
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
