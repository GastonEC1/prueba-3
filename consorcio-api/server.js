const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
    // ✨ ¡IMPORTANTE! Estas URLs deben coincidir EXACTAMENTE con las de tu frontend.
    // He incluido ambas URLs que me proporcionaste.
    origin: [
        'https://refactored-xylophone-jv659gpjqq62jqr5-5000.app.github.dev', // URL de tu frontend 
        'https://refactored-xylophone-jv659gpjqq62jqr5-3000.app.github.dev' // Para desarrollo local
    ],
    // Estas opciones son cruciales para permitir solicitudes POST, PUT, DELETE
    // y para el envío de credenciales/encabezados de autorización como 'x-auth-token'.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Permite todos los métodos HTTP comunes
    credentials: true, // Importante si usas cookies o encabezados de autorización
    optionsSuccessStatus: 200, // Para navegadores antiguos
};
app.use(cors(corsOptions));
app.use(express.json());

// Conexión a la base de datos MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a la base de datos de MongoDB');
  })
  .catch(err => console.error('Error al conectar con la base de datos:', err));

// Importar Rutas
const consorciosRouter = require('./routes/consorcios');
const inquilinosRouter = require('./routes/inquilinos');
const activosRouter = require('./routes/activos');
const authRouter = require('./routes/auth'); 
const emailRouter = require('./routes/email'); 
const pagosRouter = require('./routes/pagos'); 

// Usar Rutas
app.use('/api/consorcios', consorciosRouter);
app.use('/api/inquilinos', inquilinosRouter);
app.use('/api/activos', activosRouter);
app.use('/api/auth', authRouter);
app.use('/api/email', emailRouter); 
app.use('/api/pagos', pagosRouter);
// app.use('/api/auth', authRouter); // Esta línea está duplicada, puedes eliminar una para limpieza.

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('API de Gestión de Consorcios en funcionamiento');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de la API funcionando en el puerto ${PORT}`);
});
