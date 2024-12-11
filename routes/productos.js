const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/authMiddleware');
const {
    obtenerProductos,
    obtenerDetalleProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/productosController');

// Rutas protegidas
router.get('/producto', protegerRuta, obtenerProductos);
router.get('/producto/:id', protegerRuta, obtenerDetalleProducto);
router.post('/producto', protegerRuta, crearProducto);
router.put('/producto/:id', protegerRuta, actualizarProducto);
router.delete('/producto/:id', protegerRuta, eliminarProducto);

module.exports = router;
