const express = require('express');
const app = express();
require('./config/db');
const productoController = require('./controllers/productoController');

// Middleware para procesar JSON - DEBE IR ANTES DE LAS RUTAS
app.use(express.json());
// Middleware para procesar datos de formularios
app.use(express.urlencoded({ extended: true }));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public');

// Hacer pública la carpeta 'public' para archivos estáticos
app.use(express.static('public'));

// Rutas
app.use('/', productoController);


// Manejador de errores básico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal!');
});

app.listen(3000, () => {
    console.log('Servidor funcionando en el puerto 3000');
});