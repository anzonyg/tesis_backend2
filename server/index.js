const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Definir los orígenes permitidos (frontend en local y en Render)
const allowedOrigins = [
  'http://localhost:5173',                        // Para desarrollo local
  'https://tesis-frontend-jfsn.onrender.com'      // URL del frontend en producción (Render)
];

// Configuración de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir el acceso si el origen está en la lista o si es una solicitud sin origen (por ejemplo, desde Postman)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Middleware para bodyParser
app.use(bodyParser.json());

// Construir la URI de conexión a MongoDB Atlas usando las variables de entorno
const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

// Conectar a MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('DB conectada a MongoDB Atlas'))
  .catch(err => console.error('Error al conectar a la base de datos:', err));

// Usar el router definido en tasks.js
app.use('/tasks', require('./routes/tasks'));

// Ruta raíz para verificar el estado del servidor
app.get('', async (req, res) => {
  console.log(process.env.environment + 2);
  res.json("Inicio de servidor con éxito!");
});

// Configuración del puerto
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor web iniciado en el puerto ${PORT}`);
});
