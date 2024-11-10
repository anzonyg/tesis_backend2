const mongoose = require('mongoose');

// Definir el esquema para los datos de los sensores
const datosSensorSchema = new mongoose.Schema({
    temperatura: Number,
    humedad: Number,
    distancia: Number,
    rfid: String,
    timestamp: { type: Date, default: Date.now }, // Timestamp automático
    nombreArduino: { type: String, default: 'Arduino1' },
});

// Crear el modelo basado en el esquema
const DatosSensor = mongoose.model('monitoreoAmbiente', datosSensorSchema);

module.exports = DatosSensor;
