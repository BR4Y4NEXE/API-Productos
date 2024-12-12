// index.js
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const Producto = require("./models/Producto");
const User = require("./models/User");

const app = express();

// Configuración de conexión a MongoDB Atlas
mongoose
    .connect("mongodb+srv://brayan11647bvz2:JjXF0OTdYHZvUqyC@cluster0.uxg78.mongodb.net/Almacen", { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    })
    .then(() => console.log("Conectado a MongoDB Atlas"))
    .catch((err) => {
        console.error("Error al conectar a MongoDB Atlas:", err);
        // Loguea detalles específicos del error
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
    });

// Configuración de sesión
app.use(
    session({
        secret: "clave_secreta",
        resave: false,
        saveUninitialized: false,
    })
);

// Middleware global para proteger rutas privadas
const verificarAutenticacion = (req, res, next) => {
    const rutasPublicas = ["/", "/login", "/register"];
    if (!rutasPublicas.includes(req.path) && !req.session.userId) {
        return res.redirect("/login");
    }
    next();
};
app.use(verificarAutenticacion);

// Middleware para manejar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de vistas
app.set("view engine", "ejs");
app.set("views", __dirname + "/public");

// Servir archivos estáticos
app.use(express.static(__dirname + "/public"));

// Ruta principal
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Ruta para mostrar formulario de login
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// Manejo de inicio de sesión
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("login", { error: "Credenciales incorrectas" });
        }

        // Guardar ID de usuario en la sesión
        req.session.userId = user._id;
        res.redirect("/productos");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en el servidor");
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
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Aplica el middleware en todas las rutas protegidas
app.use("/producto", requireLogin);

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    next();
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/producto/crud');
        }
        res.clearCookie('connect.sid'); // Elimina la cookie de sesión
        res.redirect('/login');
    });
});

app.use(verificarAutenticacion);

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    next();
});


app.get("/login", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/productos");
    }
    res.render("login", { error: null });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/producto/crud');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.get('/', (req, res) => {
    res.render('login'); // Esto renderizará login.ejs como página de inicio
  });

// Configuración del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
