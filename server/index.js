const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configurar CORS para permitir acceso desde el frontend en el puerto 5173
app.use(cors({
  origin: 'http://localhost:5173' // Cambia al dominio de tu frontend si es diferente
}));

// Middleware
app.use(bodyParser.json());

// Construir la URI de conexión a MongoDB Atlas usando las variables de entorno
const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

// Conectar a MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('DB conectada a MongoDB Atlas'))
  .catch(err => console.error('Error al conectar a la base de datos:', err));

// Usar el router definido en tasks.js
app.use('/tasks', require('./routes/tasks'));

// Router
app.get('', async (req, res) => {
  console.log(process.env.environment + 2);
  res.json("Inicio de servidor con éxito!");
});


// Configuración del puerto
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor web iniciado en el puerto ${PORT}`);
});
