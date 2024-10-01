const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware'); // Importar el middleware de proxy

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS
app.use(cors());
app.use(express.json()); // Para recibir datos JSON

// Configuración de Multer para guardar las imágenes subidas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Asignar nombre único al archivo
    }
});

const upload = multer({ storage: storage });

// Ruta para subir imágenes
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`; // URL de la imagen subida
        res.json({ url: fileUrl });
    } else {
        res.status(400).send('No se subió ningún archivo.');
    }
});

// Enviar la URL de la imagen y otros datos a Google Sheets
app.post('/add-url-to-sheet', express.json(), (req, res) => {
    const { url, name, surname, product, size, model, quantity, payment } = req.body;

    const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbz85XK8eZsObTrWnXIhFl62WFeDM65qZb1U0IY9zpFIublJD4GqX-STu53ITSfV118/exec';

    // Datos que se enviarán a Google Apps Script
    const dataToSend = {
        url,
        name,
        surname,
        product,
        size,
        model,
        quantity,
        payment
    };

    axios.post(googleAppsScriptUrl, dataToSend)
        .then(response => {
            res.json({ message: 'URL y datos guardados en Google Sheets', response });
        })
        .catch(error => {
            res.status(500).send('Error al guardar en Google Sheets');
        });
});

// Configura el Proxy
app.use('/proxy', createProxyMiddleware({
    target: 'https://forms.soundestlink.com',
    changeOrigin: true,
    pathRewrite: {
        '^/proxy': '', // Reescribe la ruta
    },
}));

// Servir archivos estáticos (imágenes) desde la carpeta 'uploads'
app.use('/uploads', express.static('uploads'));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
