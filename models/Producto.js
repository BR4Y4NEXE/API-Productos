const mongoose = require('mongoose');
//crea un esquema de un documento (tabla)
const productoSchema = new mongoose.Schema({
    Nombre: {type: String, required: true},
    Descripcion: {type: String, required: true},
    Precio: {type: Number, required: true},
    Stock: {type: Number, required: true},
    // se agregan los campos existentes en la tabla con su tipo
});
// se exporta el modelo segun el esquema llamado producto 
module.exports = mongoose.model('Producto', productoSchema);