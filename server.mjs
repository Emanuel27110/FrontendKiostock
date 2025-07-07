import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Verificar que existe la carpeta build
const buildPath = path.join(__dirname, 'build');
console.log('🔍 Verificando carpeta build en:', buildPath);
console.log('✅ Carpeta build existe:', existsSync(buildPath));

// Servir archivos estáticos desde la carpeta build
app.use(express.static(buildPath));

// Log de requests para debugging
app.use((req, res, next) => {
  console.log(`📄 ${req.method} ${req.path}`);
  next();
});

// Manejar todas las rutas y redirigir a index.html
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  console.log(`🔄 Sirviendo index.html para ruta: ${req.path}`);
  res.sendFile(indexPath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
  console.log(`📁 Sirviendo desde: ${buildPath}`);
});