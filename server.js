// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

// Rutas de carpetas
const DATA_DIR = path.join(__dirname, "data");
const DATA_PATH = path.join(DATA_DIR, "pedidos.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Asegurar carpetas
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({ pedidos: [] }, null, 2));

// Multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random()}${ext}`);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(UPLOADS_DIR));

// Leer archivo
function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

// Guardar archivo
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// ---------- API ----------

// Obtener pedidos
app.get("/api/pedidos", (req, res) => {
  const data = readData();
  res.json(data.pedidos);
});

// Crear pedido
app.post("/api/pedidos", upload.single("comprobante"), (req, res) => {
  const pedido = JSON.parse(req.body.pedido);

  if (req.file) {
    pedido.comprobanteUrl = `/uploads/${req.file.filename}`;
  }

  const data = readData();
  data.pedidos.push(pedido);
  writeData(data);

  res.json({ ok: true, pedido });
});

// Actualizar pedido
app.put("/api/pedidos/:id", (req, res) => {
  const id = Number(req.params.id);
  const data = readData();

  const idx = data.pedidos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Pedido no existe" });

  data.pedidos[idx] = { ...data.pedidos[idx], ...req.body };
  writeData(data);

  res.json({ ok: true, pedido: data.pedidos[idx] });
});

// Eliminar pedido
app.delete("/api/pedidos/:id", (req, res) => {
  const id = Number(req.params.id);

  const data = readData();
  data.pedidos = data.pedidos.filter(p => p.id !== id);

  writeData(data);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
