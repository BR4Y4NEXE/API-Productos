const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const path = require('path');
const Producto = require("./models/Producto");
const User = require("./models/User");

const app = express();

// Configuración de conexión a MongoDB Atlas con opciones mejoradas
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://brayan11647bvz2:JjXF0OTdYHZvUqyC@cluster0.uxg78.mongodb.net/Almacen", { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
            socketTimeoutMS: 45000 // Timeout de socket de 45 segundos
        });
        console.log("✅ Conectado exitosamente a MongoDB Atlas");
    } catch (err) {
        console.error("❌ Error al conectar a MongoDB Atlas:", err);
        // Reintentar conexión después de 5 segundos
        setTimeout(connectDB, 5000);
    }
};

// Manejadores de eventos de conexión de Mongoose
mongoose.connection.on('error', (err) => {
    console.error('🔴 Error de conexión de Mongoose:', err);
});

mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose conectado exitosamente');
});

mongoose.connection.on('disconnected', () => {
    console.log('🟠 Mongoose desconectado');
});

// Iniciar conexión
connectDB();

// Configuración de sesión
app.use(
    session({
        secret: "clave_secreta_segura_2023",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Solo en producción
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        }
    })
);

// Middleware para verificar conexión a base de datos
const checkDatabaseConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.error('🔴 No hay conexión a la base de datos');
        return res.status(500).render("login", { 
            error: "Error de conexión a la base de datos. Intenta de nuevo más tarde." 
        });
    }
    next();
};

// Middleware global para proteger rutas privadas
const verificarAutenticacion = (req, res, next) => {
    const rutasPublicas = ["/", "/login", "/register"];
    if (!rutasPublicas.includes(req.path) && !req.session.userId) {
        return res.redirect("/login");
    }
    next();
};

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

// Ruta para mostrar formulario de login
app.get("/login", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/productos");
    }
    res.render("login", { error: null });
});

// Ruta de inicio de sesión con mejoras
app.post("/login", checkDatabaseConnection, async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            console.log(`🔒 Intento de inicio de sesión fallido para usuario: ${username}`);
            return res.render("login", { error: "Usuario no encontrado" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`🔒 Contraseña incorrecta para usuario: ${username}`);
            return res.render("login", { error: "Credenciales incorrectas" });
        }

        req.session.userId = user._id;
        res.redirect("/productos");
    } catch (err) {
        console.error("🚨 Error detallado en login:", err);
        res.status(500).render("login", { 
            error: "Error en el servidor. Intenta de nuevo." 
        });
    }
});

// Ruta para mostrar formulario de registro
app.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// Manejo de registro de usuarios
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.render("register", { error: "El usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.redirect("/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en el servidor");
    }
});

// Ruta principal
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect("/productos");
    }
    res.render('login', { error: null });
});

// Ruta para mostrar productos
app.get("/productos", async (req, res) => {
    try {
        const productos = await Producto.find({ userId: req.session.userId });
        res.render("productos", { productos });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar los productos");
    }
});

// Ruta para mostrar la interfaz de CRUD de productos
app.get("/producto/crud", async (req, res) => {
    try {
        const productos = await Producto.find({ userId: req.session.userId });
        res.render("crudProductos", { productos });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al obtener productos");
    }
});

// Manejar la creación de un nuevo producto
app.post("/producto/nuevo", async (req, res) => {
    try {
        const { Nombre, Descripcion, Precio, Stock } = req.body;

        const nuevoProducto = new Producto({
            Nombre,
            Descripcion,
            Precio,
            Stock,
            userId: req.session.userId
        });

        await nuevoProducto.save();
        res.redirect("/producto/crud");
    } catch (err) {
        console.error("Error al agregar el producto:", err);
        res.status(500).send("Error al agregar el producto");
    }
});

// Ruta para mostrar detalles de un producto
app.get("/producto/:id", async (req, res) => {
    try {
        const productoId = req.params.id;
        const producto = await Producto.findById(productoId);

        if (!producto) {
            return res.status(404).send("Producto no encontrado");
        }

        res.render("detalleProducto", { producto });
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).send("Error al obtener los detalles del producto");
    }
});

// Ruta para eliminar un producto
app.post("/producto/eliminar/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Producto.findOneAndDelete({ _id: id, userId: req.session.userId });
        res.redirect("/producto/crud");
    } catch (err) {
        console.error("Error al eliminar el producto:", err);
        res.status(500).send("Error al eliminar el producto");
    }
});

// Ruta para editar producto (formulario)
app.get("/producto/editar/:id", async (req, res) => {
    try {
        const producto = await Producto.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!producto) {
            return res.status(404).send("Producto no encontrado");
        }
        res.render("editarProducto", { producto });
    } catch (err) {
        console.error("Error al cargar el producto:", err);
        res.status(500).send("Error al cargar el producto");
    }
});

// Ruta para actualizar producto
app.post("/producto/editar/:id", async (req, res) => {
    const { Nombre, Descripcion, Precio, Stock } = req.body;
    try {
        const productoActualizado = await Producto.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { Nombre, Descripcion, Precio, Stock },
            { new: true }
        );

        if (!productoActualizado) {
            return res.status(404).send("Producto no encontrado o no autorizado para editar");
        }

        res.redirect("/producto/crud");
    } catch (err) {
        console.error("Error al actualizar el producto:", err);
        res.status(500).send("Error al actualizar el producto");
    }
});

// Manejo de cierre de sesión
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/producto/crud');
        }
        res.clearCookie('connect.sid'); // Elimina la cookie de sesión
        res.redirect('/login');
    });
});

// Aplicar middlewares
app.use(verificarAutenticacion);

// Middlewares de caché
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    next();
});

// Configuración del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});