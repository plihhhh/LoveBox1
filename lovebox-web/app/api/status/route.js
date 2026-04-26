// ==============================================
// app/api/status/route.js
// GET  → web ambil status ESP32
// POST → ESP32 kirim status via HTTP
// ==============================================

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Simpan status di /tmp (Vercel support folder ini)
const STATUS_FILE = "/tmp/lovebox_status.json";

// Status default
const DEFAULT_STATUS = {
  online: false,
  baterai: 0,
  mode: 1,
  tema: "pastel_love",
  firmware: "v1.0",
  lastSeen: null,
};

// Baca status dari file
async function readStatus() {
  try {
    const data = await fs.readFile(STATUS_FILE, "utf-8");
    const status = JSON.parse(data);

    // Cek apakah ESP32 masih online (lastSeen kurang dari 2 menit)
    if (status.lastSeen) {
      const lastSeen = new Date(status.lastSeen);
      const now = new Date();
      const diffMs = now - lastSeen;
      const diffMenit = diffMs / 1000 / 60;

      // Kalau lebih dari 2 menit tidak ada update → offline
      if (diffMenit > 2) {
        status.online = false;
      }
    }

    return status;
  } catch {
    return DEFAULT_STATUS;
  }
}

// Tulis status ke file
async function writeStatus(data) {
  await fs.writeFile(STATUS_FILE, JSON.stringify(data), "utf-8");
}

// ============================================
// GET /api/status
// Web ambil status ESP32
// ============================================
export async function GET() {
  try {
    const status = await readStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("Error ambil status:", err);
    return NextResponse.json(DEFAULT_STATUS, { status: 500 });
  }
}

// ============================================
// POST /api/status
// ESP32 kirim status via HTTP setiap 30 detik
// Header: x-device-key: lovebox_secret_key
// Body: { online, baterai, mode, tema, firmware }
// ============================================
export async function POST(request) {
  try {
    // Verifikasi device key
    //const deviceKey = request.headers.get("x-device-key");
    //if (deviceKey !== process.env.DEVICE_KEY) {
      //return NextResponse.json(
        //{ success: false, message: "Unauthorized" },
        //{ status: 401 }
      //);
    }

    const body = await request.json();

    // Simpan status dengan timestamp
    const status = {
      online: body.online ?? true,
      baterai: body.baterai ?? 0,
      mode: body.mode ?? 1,
      tema: body.tema ?? "pastel_love",
      firmware: body.firmware ?? "v1.0",
      lastSeen: new Date().toISOString(),
    };

    await writeStatus(status);

    console.log("Status ESP32 diterima:", status);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error terima status:", err);
    return NextResponse.json(
      { success: false, message: "Gagal simpan status" },
      { status: 500 }
    );
  }
}