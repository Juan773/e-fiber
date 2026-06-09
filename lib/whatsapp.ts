/**
 * Cliente HTTP para el servidor Baileys independiente (whatsapp-server.js en puerto 3001).
 * Next.js llama a este módulo; el módulo llama al servidor Express.
 */

const WA_SERVER = process.env.WA_SERVER_URL ?? "http://localhost:3001";

export interface WaStatus {
  status: "disconnected" | "connecting" | "connected";
  qr: string | null;
  qrImage: string | null;
  error: string | null;
}

async function callServer(path: string, method: "GET" | "POST" = "GET", body?: object): Promise<Response> {
  return fetch(`${WA_SERVER}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
}

export async function getWhatsAppStatus(): Promise<WaStatus> {
  try {
    const res = await callServer("/status");
    return res.json();
  } catch {
    return { status: "disconnected", qr: null, qrImage: null, error: "Servidor WhatsApp no disponible. Corre: node whatsapp-server.js" };
  }
}

export async function connectWhatsApp(): Promise<void> {
  await callServer("/connect", "POST");
}

export async function disconnectWhatsApp(): Promise<void> {
  await callServer("/disconnect", "POST");
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const res = await callServer("/send", "POST", { phone, message });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Error enviando mensaje WhatsApp:", err);
    return false;
  }
}
