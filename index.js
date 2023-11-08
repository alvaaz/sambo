const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const app = express();
const upload = multer({ dest: 'uploads/' });

// Configurar directorio público para archivos estáticos
app.use(express.static('public'));

// Middleware para parsear el body del request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para cargar el archivo Excel
app.post('/upload', upload.single('excel'), (req, res) => {
  if (req.file) {
    // Procesar el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetNameList = workbook.SheetNames;
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);

    // Guardar los datos en memoria, en un entorno real deberías almacenarlos en una base de datos
    req.app.locals.data = data;
    res.send('Archivo cargado y procesado');
  } else {
    res.status(400).send('No se subió ningún archivo');
  }
});

// Ruta para buscar por ID y nombre
app.get('/search', (req, res) => {
  const { id, name } = req.query;
  const data = req.app.locals.data;

  if (data) {
    let results = data;

    if (id) {
      results = results.filter(row => row.__EMPTY && row.__EMPTY.toString() === id.toString());
    }

    if (name) {
      // Normaliza y convierte a minúsculas el nombre de búsqueda si no es undefined o null
      const normalizedSearchName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
      results = results.filter(row => {
        // Verifica que la propiedad exista y no sea null o undefined antes de normalizar
        if (row.__EMPTY_1 != null) {
          const normalizedName = row.__EMPTY_1.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return normalizedName.includes(normalizedSearchName);
        }
        return false;
      });
    }

    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).send('No se encontraron coincidencias');
    }
  } else {
    res.status(500).send('No hay datos cargados');
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
