const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
    Nombre: String,
    Descripcion: String,
    Precio: Number,
    Stock: Number,
    userId: mongoose.Schema.Types.ObjectId, // Relación con el usuario
});

module.exports = mongoose.model("Producto", productoSchema);
