/**
 * E-Fiber — Servidor WhatsApp (Baileys)
 * Correr en una terminal separada: node whatsapp-server.js
 * Puerto: 3001
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const express = require("express");
const QRCode = require("qrcode");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const PORT = 3001;
const AUTH_FOLDER = path.join(__dirname, ".whatsapp-auth");

// ── Estado en memoria ─────────────────────────────────────────────────────────
let state = {
  status: "disconnected", // "disconnected" | "connecting" | "connected"
  qr: null,
  error: null,
};
let sock = null;
let reconnectTimer = null;

// ── Baileys ───────────────────────────────────────────────────────────────────
async function connect() {
  if (state.status === "connected" || state.status === "connecting") {
    console.log("[WA] Ya está conectado o conectando — ignorando");
    return;
  }

  if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER, { recursive: true });

  state = { status: "connecting", qr: null, error: null };
  console.log("[WA] Iniciando conexión...");

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();
    console.log("[WA] Versión WA:", version.join("."));

    sock = makeWASocket({
      version,
      logger: pino({ level: "warn" }),
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: "silent" })),
      },
      printQRInTerminal: true,
      browser: ["E-Fiber ISP", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        state.qr = qr;
        state.status = "connecting";
        state.error = null;
        console.log("[WA] QR generado — escanea con WhatsApp");
      }

      if (connection === "open") {
        state = { status: "connected", qr: null, error: null };
        console.log("[WA] ✅ Conectado exitosamente");
      }

      if (connection === "close") {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        console.log("[WA] Conexión cerrada. Código:", code, "| LoggedOut:", loggedOut);
        console.log("[WA] Error:", lastDisconnect?.error?.message ?? "sin mensaje");

        sock = null;

        if (loggedOut) {
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          state = { status: "disconnected", qr: null, error: "Sesión cerrada. Escanea el QR de nuevo." };
        } else {
          state = { status: "disconnected", qr: null, error: null };
          console.log("[WA] Reconectando en 5s...");
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    });
  } catch (err) {
    console.error("[WA] Error al inicializar:", err.message);
    state = { status: "disconnected", qr: null, error: err.message };
    sock = null;
  }
}

async function disconnect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  try {
    if (sock) { await sock.logout(); sock = null; }
  } catch { sock = null; }
  fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
  state = { status: "disconnected", qr: null, error: null };
  console.log("[WA] Desconectado y sesión eliminada");
}

async function sendMessage(phone, message) {
  if (!sock || state.status !== "connected") {
    console.warn("[WA] No conectado — mensaje no enviado a:", phone);
    return false;
  }
  try {
    let clean = phone.replace(/[\s\-\(\)\+]/g, "");
    if (clean.startsWith("0051")) clean = clean.slice(4);
    if (clean.startsWith("51") && clean.length === 11) clean = clean.slice(2);
    if (!clean.startsWith("51")) clean = "51" + clean;
    const jid = `${clean}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log("[WA] Mensaje enviado a:", jid);
    return true;
  } catch (err) {
    console.error("[WA] Error enviando mensaje:", err.message);
    return false;
  }
}

// ── Express API ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// CORS para que Next.js pueda llamarlo desde localhost:3000
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// GET /status — estado actual + QR como imagen base64
app.get("/status", async (req, res) => {
  let qrImage = null;
  if (state.qr) {
    try { qrImage = await QRCode.toDataURL(state.qr, { width: 280 }); } catch { /* noop */ }
  }
  res.json({ ...state, qrImage });
});

// POST /connect — inicia la conexión
app.post("/connect", async (req, res) => {
  connect().catch((e) => console.error("[WA] connect error:", e));
  res.json({ ok: true });
});

// POST /disconnect — cierra la sesión
app.post("/disconnect", async (req, res) => {
  await disconnect();
  res.json({ ok: true });
});

// POST /send — envía un mensaje
app.post("/send", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: "phone y message requeridos" });
  const success = await sendMessage(phone, message);
  res.json({ ok: true, success });
});

app.listen(PORT, () => {
  console.log(`\n🟢 Servidor WhatsApp corriendo en http://localhost:${PORT}`);
  console.log("   GET  /status     → estado de conexión + QR");
  console.log("   POST /connect    → iniciar conexión");
  console.log("   POST /disconnect → cerrar sesión");
  console.log("   POST /send       → enviar mensaje { phone, message }\n");
});
