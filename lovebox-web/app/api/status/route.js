// ==============================================
// app/api/status/route.js
// API Status — Mengambil status terakhir ESP32
// Route ini bersifat PUBLIC (tidak perlu auth)
// ==============================================

import { NextResponse } from "next/server";
import { getLastStatus } from "@/lib/mqtt";

/**
 * GET /api/status
 *
 * Mengembalikan status terakhir yang diterima dari
 * ESP32 melalui topik MQTT "lovebox/status".
 * Tidak memerlukan autentikasi.
 *
 * Response:
 *   {
 *     online: boolean,
 *     baterai: number,
 *     mode: number,
 *     firmware: string,
 *     lastSeen: string | null
 *   }
 */
export async function GET() {
  try {
    // Ambil status terakhir dari variabel global di lib/mqtt.js
    const status = getLastStatus();

    return NextResponse.json(status);
  } catch (err) {
    console.error("❌ Error ambil status:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil status perangkat",
        online: false,
        baterai: 0,
        mode: 1,
        firmware: "unknown",
        lastSeen: null,
      },
      { status: 500 }
    );
  }
}
