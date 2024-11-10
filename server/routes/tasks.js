const express = require('express');
const router = express.Router();
const DatosSensor = require('../models/controlAmbiente'); // Asegúrate de que el modelo esté en la ruta correcta
let arduinoData = {};
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');

router.get('/anzony', async (req, res) => {

  res.json("exito ANZONY!!!");
});

// Ruta para recibir los datos del Arduino y guardarlos en la base de datos
router.post('/send-data', (req, res) => {
  arduinoData = req.body;
  const datos = new DatosSensor({
    temperatura: req.body.temperature,
    humedad: req.body.humidity,
    distancia: req.body.distance,
    rfid: req.body.rfid,
    nombreArduino: 'Arduino1',
  });

  datos.save()
  .then(savedData => {
    console.log('Datos guardados en la base de datos: ', arduinoData);

    // Verifica si la temperatura supera el umbral para enviar una alerta
    if (arduinoData.temperature >= 33) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'anzonyg@gmail.com',
        subject: '¡Alerta de Temperatura!',
        text: `La temperatura ha alcanzado los ${arduinoData.temperature} °C. Por favor, toma medidas inmediatas.`
      };

      const transporter = nodemailer.createTransport({
        service: 'gmail', // Cambia esto al servicio de correo que estés usando (Ej.: Outlook, Yahoo)
        auth: {
          user: process.env.EMAIL_USER, // Asegúrate de tener estas variables en tu archivo .env
          pass: process.env.EMAIL_PASS
        }
      });

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo:', error);
        } else {
          console.log('Correo enviado: ' + info.response);
        }
      });
    }
    console.log('User:', process.env.EMAIL_USER);
console.log('Pass:', process.env.EMAIL_PASS);


    res.status(200).json({ message: 'Datos recibidos y guardados correctamente' });
  })
  .catch(err => {
    console.error('Error al guardar en la base de datos', err);
    res.status(500).json({ message: 'Error al guardar los datos', error: err });
  });
});
// Variable para almacenar los datos del Arduino

// Ruta para obtener el último dato guardado en la base de datos
router.get('/ultimo-dato', async (req, res) => {
  try {
    const ultimoDato = await DatosSensor.findOne().sort({ _id: -1 }); // Ordena por _id para obtener el último registro
    res.json(ultimoDato); // Devuelve el último dato en formato JSON
  } catch (err) {
    console.error('Error al obtener el último dato', err);
    res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

//Ruta para grafica Temperatura - Hora
router.get('/temperatura-hora', async (req, res) => {
  try {
    const datos = await DatosSensor.aggregate([
      {
        $match: { timestamp: { $exists: true } }
      },
      {
        $group: {
          _id: { $hour: "$timestamp" }, // Agrupa por la hora UTC
          temperaturaPromedio: { $avg: "$temperatura" }
        }
      },
      {
        $match: { _id: { $ne: null } }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Convierte la hora UTC a la hora local de Guatemala
    const datosConvertidos = datos.map(dato => {
      const horaGuatemala = moment().utc().hour(dato._id).tz('America/Guatemala').format('H');
      return {
        _id: horaGuatemala,  // Asigna la hora convertida
        temperaturaPromedio: dato.temperaturaPromedio
      };
    });

    res.json(datosConvertidos);
  } catch (err) {
    console.error('Error al obtener los datos por hora', err);
    res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

// Ruta para obtener la temperatura promedio por día del mes
router.get('/temperatura-dia', async (req, res) => {
  try {
    const datos = await DatosSensor.aggregate([
      {
        $match: { timestamp: { $exists: true } }  // Asegúrate de que los datos tengan un timestamp
      },
      {
        $group: {
          _id: {
            mes: { $month: "$timestamp" },  // Agrupar por mes
            dia: { $dayOfMonth: "$timestamp" }  // Agrupar por día
          },
          temperaturaPromedio: { $avg: "$temperatura" }  // Calcular el promedio de la temperatura
        }
      },
      {
        $sort: { "_id.dia": 1 }  // Ordenar por día dentro de cada mes
      }
    ]);

    res.json(datos);
  } catch (err) {
    console.error('Error al obtener los datos de temperatura por día y mes', err);
    res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

router.get('/temperatura-mes', async (req, res) => {
  try {
      const datos = await DatosSensor.aggregate([
          {
              $match: { timestamp: { $exists: true } }  // Asegúrate de que los datos tengan un timestamp
          },
          {
              $group: {
                  _id: {
                      mes: { $month: "$timestamp" },  // Agrupar por mes
                      ano: { $year: "$timestamp" }  // Agrupar por año
                  },
                  temperaturaPromedio: { $avg: "$temperatura" }  // Calcular el promedio de la temperatura
              }
          },
          {
              $sort: { "_id.mes": 1 }  // Ordenar por mes
          }
      ]);

      res.json(datos);
  } catch (err) {
      console.error('Error al obtener los datos de temperatura por mes y año', err);
      res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});


// Ruta para obtener la humedad promedio por hora
router.get('/humedad-hora', async (req, res) => {
  try {
    const datos = await DatosSensor.aggregate([
      {
        $match: { timestamp: { $exists: true } }  // Asegurarse de que los datos tengan un timestamp
      },
      {
        $group: {
          _id: { $hour: "$timestamp" },  // Agrupar por la hora del campo "timestamp"
          humedadPromedio: { $avg: "$humedad" }  // Calcular el promedio de la humedad
        }
      },
      {
        $match: { _id: { $ne: null } }  // Filtrar los grupos sin hora válida
      },
      {
        $sort: { _id: 1 }  // Ordenar por hora (de 0 a 23)
      }
    ]);

    const datosConvertidos = datos.map(dato => {
      const horaLocal = moment().utc().hour(dato._id).tz('America/Guatemala').format('HH');  // Convertir al formato 24 horas
      return {
        _id: horaLocal,  // Asigna la hora convertida
        humedadPromedio: dato.humedadPromedio
      };
    });

    // Enviar los datos al frontend
    res.json(datosConvertidos);
  } catch (err) {
    console.error('Error al obtener los datos de humedad por hora', err);
    res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

// Ruta para obtener la humedad promedio por día del mes
router.get('/humedad-dia', async (req, res) => {
  try {
    const datos = await DatosSensor.aggregate([
      {
        $match: { timestamp: { $exists: true } }  // Asegurarse de que los datos tengan un timestamp
      },
      {
        $group: {
          _id: {
            mes: { $month: "$timestamp" },  // Agrupar por mes
            dia: { $dayOfMonth: "$timestamp" }  // Agrupar por día
          },
          humedadPromedio: { $avg: "$humedad" }  // Calcular el promedio de la humedad
        }
      },
      {
        $sort: { "_id.dia": 1 }  // Ordenar por día dentro de cada mes
      }
    ]);

    res.json(datos);
  } catch (err) {
    console.error('Error al obtener los datos de humedad por día y mes', err);
    res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

// Ruta para obtener la humedad promedio por mes agrupado por año
router.get('/humedad-mes', async (req, res) => {
  try {
      const datos = await DatosSensor.aggregate([
          {
              $match: { timestamp: { $exists: true } }  // Asegúrate de que los datos tengan un timestamp
          },
          {
              $group: {
                  _id: {
                      mes: { $month: "$timestamp" },  // Agrupar por mes
                      ano: { $year: "$timestamp" }    // Agrupar por año
                  },
                  humedadPromedio: { $avg: "$humedad" }  // Calcular el promedio de la humedad
              }
          },
          {
              $sort: { "_id.mes": 1 }  // Ordenar por mes (1: enero, 12: diciembre)
          }
      ]);

      res.json(datos);
  } catch (err) {
      console.error('Error al obtener los datos de humedad por mes y año:', err);
      res.status(500).json({ message: 'Error al obtener los datos', error: err });
  }
});

router.get('/', (req, res) => {
  // Comprobar si la temperatura es mayor o igual a 31°C
  let alertMessage = '';

  if (arduinoData.temperature >= 31) {
    alertMessage = '<div class="alert alert-danger" role="alert">¡Alerta! La temperatura ha alcanzado o superado los 31 °C</div>';
  }

  const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Datos del Arduino</title>
          <!-- Bootstrap CSS -->
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <script>
            // Actualizar la página cada 5 segundos
            setInterval(() => {
              window.location.reload();
            }, 5000);
          </script>
        </head>
        <body>
          <div class="container mt-5">
            <div class="card text-center">
              <div class="card-header bg-primary text-white">
                <h2>Datos del Arduino</h2>
              </div>
              <div class="card-body">
                ${alertMessage} <!-- Aquí se muestra la alerta si la temperatura es >= 31°C -->
                <h5 class="card-title">Sensores</h5>
                <p class="card-text"><strong>Temperatura:</strong> ${arduinoData.temperature || 'No recibido'} °C</p>
                <p class="card-text"><strong>Humedad:</strong> ${arduinoData.humidity || 'No recibido'} %</p>
                <p class="card-text"><strong>Distancia:</strong> ${arduinoData.distance || 'No recibido'} cm</p>
                <p class="card-text"><strong>RFID:</strong> ${arduinoData.rfid || 'No recibido'}</p>
              </div>
              <div class="card-footer text-muted">
                Actualizado en tiempo real
              </div>
            </div>
          </div>
  
          <!-- Bootstrap JS and dependencies -->
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        </body>
      </html>
    `;

  res.send(html);
});



module.exports = router;