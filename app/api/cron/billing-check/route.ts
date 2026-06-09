import { NextResponse } from "next/server";
import { checkAndMark } from "@/lib/billing-notifications";

// GET /api/cron/billing-check
// Llamar diariamente (cron diario a medianoche o similar).
// Detecta el día del mes y marca los pagos con la etapa correspondiente.

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("x-cron-secret");
    if (auth !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await checkAndMark();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Error en billing-check:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
