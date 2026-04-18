"use client";

import { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Clock, 
  Calendar, 
  Image as ImageIcon, 
  MessageCircle, 
  CloudSun, 
  Upload, 
  Trash2, 
  Battery, 
  BatteryFull, 
  BatteryMedium, 
  BatteryLow,
  Wifi
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminDashboard() {
  const router = useRouter();

  // State: Status Perangkat
  const [status, setStatus] = useState({
    online: false,
    battery: 0,
    firmwareApp: "1.0.0"
  });

  // State: Mode Tampilan (Card A)
  const [modes, setModes] = useState({
    jam: true,
    tanggal: true,
    foto: true,
    pesan: true,
    cuaca: true
  });
  const [loadingMode, setLoadingMode] = useState(false);

  // State: Tema Layar TFT (Card Baru)
  const [activeTheme, setActiveTheme] = useState("pastel_love");
  const [loadingTheme, setLoadingTheme] = useState(false);

  const tftThemes = [
    { id: 'pastel_love', name: 'Pastel Love', emoji: '🌸', color: 'bg-pink-100 text-pink-600 border-pink-200' },
    { id: 'classic_dark', name: 'Classic Dark', emoji: '🌙', color: 'bg-gray-800 text-gray-100 border-gray-700' },
    { id: 'retro_8bit', name: 'Retro 8-Bit', emoji: '👾', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { id: 'neon_cyberpunk', name: 'Cyberpunk', emoji: '⚡', color: 'bg-cyan-100 text-cyan-600 border-cyan-200' },
    { id: 'ocean_breeze', name: 'Ocean Breeze', emoji: '🌊', color: 'bg-blue-100 text-blue-600 border-blue-200' }
  ];

  // State: Kirim Pesan (Card B)
  const [pesan, setPesan] = useState("");
  const [warnaPesan, setWarnaPesan] = useState("#FFFFFF");
  const [ukuranPesan, setUkuranPesan] = useState("Sedang");
  const [fontPesan, setFontPesan] = useState("Sans-serif");
  const [loadingPesan, setLoadingPesan] = useState(false);

  const warnaPilihan = ["#FFFFFF", "#F8B4C8", "#B4D4F8", "#F8D4B4", "#B4F8B4", "#4A4A4A"];
  const ukuranPilihan = ["Kecil", "Sedang", "Besar"];
  const fontPilihan = ["Sans-serif", "Serif", "Monospace", "Cursive"];

  // State: Kelola Foto (Card C)
  const [fotos, setFotos] = useState([]);
  const [intervalFoto, setIntervalFoto] = useState(10);
  const [loadingFotoUpload, setLoadingFotoUpload] = useState(false);
  const [loadingFotoSave, setLoadingFotoSave] = useState(false);
  const fileInputRef = useRef(null);

  // State: Pengaturan (Card D)
  const [brightness, setBrightness] = useState(50);
  const [overrideMode, setOverrideMode] = useState("Default");
  const [loadingPengaturan, setLoadingPengaturan] = useState(false);

  // State: Update Firmware (Card E)
  const [firmwareFile, setFirmwareFile] = useState(null);
  const [loadingOTA, setLoadingOTA] = useState(false);
  const [otaProgress, setOtaProgress] = useState(0);

  // State: Reset WiFi (Card F)
  const [loadingWifiReset, setLoadingWifiReset] = useState(false);

  // Real-time Status via MQTT WebSockets
  useEffect(() => {
    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_URL, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
    });

    client.on("connect", () => {
      console.log("WebSocket terhubung ke MQTT!");
      client.subscribe("lovebox/status");
    });

    client.on("message", (topic, message) => {
      if (topic === "lovebox/status") {
        try {
          const data = JSON.parse(message.toString());
          setStatus(prev => ({
            ...prev,
            online: data.online ?? true, 
            battery: data.battery ?? prev.battery,
            firmwareApp: data.firmwareApp ?? prev.firmwareApp
          }));
        } catch (error) {
          console.error("Gagal parse MQTT status:", error);
        }
      }
    });

    client.on("close", () => setStatus(prev => ({ ...prev, online: false })));
    client.on("offline", () => setStatus(prev => ({ ...prev, online: false })));

    // Cleanup saat komponen unmount
    return () => {
      if (client) client.end();
    };
  }, []);

  // Fetch Initial Data (Fotos dll)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/foto");
        if (res.ok) {
          const data = await res.json();
          setFotos(data.fotos || data || []);
          if (data.interval) setIntervalFoto(data.interval);
        }
      } catch (e) {
        console.error("Gagal load foto:", e);
      }
    };
    fetchData();
  }, []);

  // Handlers
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "GET" });
      router.push("/");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  const handleSaveMode = async () => {
    setLoadingMode(true);
    try {
      const res = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modes)
      });
      if (res.ok) toast.success("Mode berhasil disimpan!");
      else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal menyimpan mode");
    }
    setLoadingMode(false);
  };

  const handleSaveTheme = async () => {
    setLoadingTheme(true);
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: activeTheme })
      });
      if (res.ok) toast.success("Tema layar berhasil diubah!");
      else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal mengubah tema layar");
    }
    setLoadingTheme(false);
  };

  const handleKirimPesan = async () => {
    if (!pesan.trim()) return toast.error("Pesan tidak boleh kosong");
    setLoadingPesan(true);
    try {
      const res = await fetch("/api/pesan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan, warna: warnaPesan, ukuran: ukuranPesan, font: fontPesan })
      });
      if (res.ok) {
        toast.success("Pesan terkirim! 💌");
        setPesan("");
      } else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal mengirim pesan");
    }
    setLoadingPesan(false);
  };

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoadingFotoUpload(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/foto", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        toast.success("Foto berhasil diupload!");
        // Refresh daftar foto
        const resData = await res.json();
        if (resData.fotos) setFotos(resData.fotos);
        else if (Array.isArray(resData)) setFotos(resData);
      } else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal upload foto");
    }
    setLoadingFotoUpload(false);
  };

  const handleHapusFoto = async (id) => {
    try {
      const res = await fetch(`/api/foto?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFotos(prev => prev.filter(f => f.id !== id));
        toast.success("Foto dihapus");
      } else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal menghapus foto");
    }
  };

  const handleSavePengaturanFoto = async () => {
    setLoadingFotoSave(true);
    try {
      const res = await fetch("/api/mode", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalFoto })
      });
      if (res.ok) toast.success("Pengaturan foto disimpan!");
      else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan foto");
    }
    setLoadingFotoSave(false);
  };

  const handleSavePengaturan = async () => {
    setLoadingPengaturan(true);
    try {
      const res = await fetch("/api/brightness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brightness, overrideMode })
      });
      if (res.ok) toast.success("Pengaturan berhasil disimpan!");
      else throw new Error("Gagal");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
    }
    setLoadingPengaturan(false);
  };

  const handleOTA = async () => {
    if (!firmwareFile) return;
    setLoadingOTA(true);
    setOtaProgress(0);
    
    const formData = new FormData();
    formData.append("file", firmwareFile);
    
    // Simulasi progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 90) {
        clearInterval(progressInterval);
        progress = 90;
      }
      setOtaProgress(progress);
    }, 500);

    try {
      const res = await fetch("/api/ota", {
        method: "POST",
        body: formData
      });
      
      clearInterval(progressInterval);
      setOtaProgress(100);
      
      if (res.ok) {
        toast.success("Firmware berhasil diupdate!");
      } else {
        throw new Error("Gagal");
      }
    } catch (error) {
      clearInterval(progressInterval);
      setOtaProgress(0);
      toast.error("Gagal update firmware");
    }
    
    setTimeout(() => {
      setLoadingOTA(false);
      setOtaProgress(0);
      setFirmwareFile(null);
    }, 1500);
  };

  // Fungsi untuk handle Reset WiFi
  const handleResetWifi = async () => {
    // Cek status device online atau offline
    if (!status.online) {
      toast.error("Gagal mengirim perintah. Pastikan device online.");
      return;
    }

    // Konfirmasi kepada user sebelum eksekusi
    const isConfirmed = window.confirm("Yakin mau reset WiFi? Device akan meminta setup WiFi baru.");
    if (!isConfirmed) return;

    // Set loading state dan lakukan request ke endpoint
    setLoadingWifiReset(true);
    try {
      const res = await fetch("/api/wifi-reset", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success("Perintah reset WiFi berhasil dikirim 📶");
      } else {
        throw new Error(data.message || "Gagal");
      }
    } catch (error) {
      toast.error(error.message || "Gagal mengirim perintah reset WiFi");
    } finally {
      // Reset loading state setelah selesai
      setLoadingWifiReset(false);
    }
  };

  // Helper Icon Baterai
  const renderBatteryIcon = () => {
    if (status.battery > 70) return <BatteryFull size={16} />;
    if (status.battery > 30) return <BatteryMedium size={16} />;
    return <BatteryLow size={16} className="text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-gray-800 pb-12 font-poppins" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Toaster position="top-center" />
      
      {/* HEADER STICKY */}
      <header className="sticky top-0 bg-white shadow-sm z-50 mb-6">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-orange-300 bg-clip-text text-transparent">
              Halo, Muflih 👋
            </h1>
            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span>{status.online ? "Online" : "Offline"}</span>
              </div>
              <div className="flex items-center space-x-1">
                {renderBatteryIcon()}
                <span>{status.battery}%</span>
              </div>
              <div>v{status.firmwareApp}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* CONTAINER MAX-WIDTH */}
      <main className="max-w-2xl mx-auto px-4 space-y-4">
        
        {/* CARD A - Atur Mode Tampilan */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Atur Mode Tampilan 💡
          </h2>
          <div className="space-y-3">
            {[
              { id: 'jam', label: 'Jam', icon: Clock },
              { id: 'tanggal', label: 'Tanggal', icon: Calendar },
              { id: 'foto', label: 'Foto', icon: ImageIcon },
              { id: 'pesan', label: 'Pesan', icon: MessageCircle },
              { id: 'cuaca', label: 'Cuaca', icon: CloudSun }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-[#F8B4C8]" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={modes[item.id]}
                    onChange={() => setModes(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F8B4C8]"></div>
                </label>
              </div>
            ))}
          </div>
          <button 
            disabled={loadingMode}
            onClick={handleSaveMode}
            className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-[#FFD1DA] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-70"
          >
            {loadingMode ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Simpan Perubahan"}
          </button>
        </section>

        {/* CARD A2 - Tema Layar TFT */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Pilih Tema Layar 🎨
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {tftThemes.map((thm) => (
              <button
                key={thm.id}
                onClick={() => setActiveTheme(thm.id)}
                className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                  activeTheme === thm.id 
                    ? `shadow-md ring-2 ring-pink-300 scale-[1.02] ${thm.color}`
                    : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <div className="text-xl mb-1">{thm.emoji}</div>
                <div>{thm.name}</div>
              </button>
            ))}
          </div>
          <button 
            disabled={loadingTheme}
            onClick={handleSaveTheme}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-[#FFD1DA] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-70"
          >
            {loadingTheme ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Terapkan Tema"}
          </button>
        </section>

        {/* CARD B - Kirim Pesan */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Kirim Pesan 💌
          </h2>
          <div className="relative">
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 h-24 text-sm focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 transition-all resize-none"
              placeholder="Tulis pesanmu untuk Suci..."
              maxLength={100}
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
            ></textarea>
            <span className="absolute bottom-3 right-3 text-xs text-gray-400">
              {pesan.length}/100
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Warna Teks</label>
              <div className="flex gap-2">
                {warnaPilihan.map(color => (
                  <button
                    key={color}
                    onClick={() => setWarnaPesan(color)}
                    className={`w-6 h-6 rounded-full border border-gray-200 transition-transform ${warnaPesan === color ? 'ring-2 ring-gray-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Ukuran</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {ukuranPilihan.map(uk => (
                  <button
                    key={uk}
                    onClick={() => setUkuranPesan(uk)}
                    className={`flex-1 text-xs py-1 rounded-md transition-colors ${ukuranPesan === uk ? 'bg-white shadow-sm font-medium text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {uk}
                  </button>
                ))}
              </div>
            </div>
            {/* Opsi Font */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Gaya Huruf (Font)</label>
              <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap">
                {fontPilihan.map(fnt => (
                  <button
                    key={fnt}
                    onClick={() => setFontPesan(fnt)}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors whitespace-nowrap ${fontPesan === fnt ? 'bg-white shadow-sm font-medium text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {fnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Preview</label>
            <div className="bg-gray-100 min-h-[80px] rounded-xl flex items-center justify-center p-4">
              <p 
                className="text-center w-full break-words font-medium"
                style={{ 
                  color: warnaPesan,
                  textShadow: warnaPesan === '#FFFFFF' ? '0px 1px 2px rgba(0,0,0,0.1)' : 'none',
                  fontSize: ukuranPesan === 'Kecil' ? '0.875rem' : ukuranPesan === 'Besar' ? '1.25rem' : '1rem',
                  fontFamily: fontPesan.toLowerCase()
                }}
              >
                {pesan || "Preview pesan..."}
              </p>
            </div>
          </div>

          <button 
            disabled={loadingPesan}
            onClick={handleKirimPesan}
            className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-[#FFD1DA] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-70"
          >
            {loadingPesan ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Kirim Sekarang 💌"}
          </button>
        </section>

        {/* CARD C - Kelola Foto */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-4 relative overflow-hidden">
          {loadingFotoUpload && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
              <p className="mt-2 text-sm font-medium text-pink-500">Mengunggah...</p>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Kelola Foto 🖼️
          </h2>

          <div 
            className="border-2 border-dashed border-pink-300 bg-pink-50/50 rounded-xl p-6 text-center cursor-pointer hover:bg-pink-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleUploadFoto}
            />
            <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Upload size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Drag foto atau klik upload</p>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
            {fotos.length > 0 ? fotos.map((foto) => (
              <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url || foto.path || '/placeholder-image.jpg'} alt="Foto" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleHapusFoto(foto.id)}
                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 hover:scale-105 transition-all shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-2 md:col-span-3 text-center py-6 text-gray-400 text-sm">
                Belum ada foto.
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
              <span>Ganti foto setiap</span>
              <span className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded text-xs font-semibold">{intervalFoto} detik</span>
            </label>
            <input 
              type="range" 
              min="3" 
              max="30" 
              step="1"
              value={intervalFoto}
              onChange={(e) => setIntervalFoto(parseInt(e.target.value))}
              className="w-full accent-[#F8B4C8] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-1"
            />
          </div>

          <button 
            disabled={loadingFotoSave}
            onClick={handleSavePengaturanFoto}
            className="mt-5 w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center disabled:opacity-70"
          >
            {loadingFotoSave ? (
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
            ) : "Simpan Pengaturan Foto"}
          </button>
        </section>

        {/* CARD D - Pengaturan Device */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Pengaturan ⚙️
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
                <span>Kecerahan: {brightness}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full accent-[#F8B4C8] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Override Mode Tampilan</label>
              <select 
                value={overrideMode}
                onChange={(e) => setOverrideMode(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-300 text-sm appearance-none"
              >
                <option value="Default">Default</option>
                <option value="Jam">Jam</option>
                <option value="Tanggal">Tanggal</option>
                <option value="Foto">Foto</option>
                <option value="Pesan">Pesan</option>
                <option value="Cuaca">Cuaca</option>
              </select>
            </div>
          </div>

          <button 
            disabled={loadingPengaturan}
            onClick={handleSavePengaturan}
            className="mt-5 w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors text-sm flex items-center justify-center disabled:opacity-70"
          >
            {loadingPengaturan ? (
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
            ) : "Simpan Pengaturan"}
          </button>
        </section>

        {/* CARD E - Update Firmware */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            Update Firmware 🔧
          </h2>
          <p className="text-sm text-gray-500 mb-4">Versi saat ini: <span className="font-semibold text-gray-700">{status.firmwareApp}</span></p>
          
          <div className="bg-[#FFF8E1] border border-yellow-200 rounded-xl p-3 mb-4 flex gap-3 text-yellow-800 text-xs">
            <span>⚠️</span>
            <p>Pastikan device terhubung WiFi sebelum update</p>
          </div>

          <div className="mb-4">
            <input 
              type="file" 
              accept=".bin" 
              id="firmware-upload"
              className="hidden"
              onChange={(e) => setFirmwareFile(e.target.files?.[0])}
            />
            <label 
              htmlFor="firmware-upload"
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-500 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors text-sm"
            >
              <span className="truncate pr-2 font-medium">
                {firmwareFile ? firmwareFile.name : "Pilih file .bin"}
              </span>
              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap">
                Browse
              </div>
            </label>
          </div>

          {loadingOTA && (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold text-pink-500 mb-1">
                <span>Uploading...</span>
                <span>{otaProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-pink-400 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${otaProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button 
            disabled={!firmwareFile || loadingOTA}
            onClick={handleOTA}
            className={`w-full py-3 rounded-xl font-medium transition-colors text-sm flex items-center justify-center ${
              !firmwareFile 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-400 hover:bg-red-500 text-white shadow-sm'
            }`}
          >
            {loadingOTA ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Update Firmware"}
          </button>
        </section>

        {/* CARD F - Pengaturan WiFi */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Pengaturan WiFi 📶
          </h2>
          
          <div className="bg-[#FFF8E1] border border-yellow-200 rounded-xl p-4 mb-5 text-yellow-800 text-sm">
            <div className="flex gap-2 mb-1">
              <span>⚠️</span>
              <p className="font-semibold">Reset WiFi hanya berfungsi saat device masih terhubung internet.</p>
            </div>
            <p className="ml-7 opacity-90">Setelah reset, Suci perlu setup WiFi baru lewat hotspot <strong>RoboLove-Setup</strong>.</p>
          </div>

          <button 
            disabled={loadingWifiReset || !status.online}
            onClick={handleResetWifi}
            className={`w-full py-3 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 ${
              (!status.online) 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-400 hover:bg-red-500 text-white shadow-sm'
            }`}
          >
            {loadingWifiReset ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Wifi size={18} />
                <span>Reset WiFi Device</span>
              </>
            )}
          </button>
        </section>

      </main>
    </div>
  );
}
