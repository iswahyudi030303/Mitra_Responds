const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const TelegramBot = require("node-telegram-bot-api");
const { GoogleSpreadsheet } = require('google-spreadsheet');

// === KONFIGURASI ===
const TELEGRAM_TOKEN = "8372447760:AAFvRtsy85GZx8K4UMFTPCnue5pQ5SlMtxc";
const DEFAULT_CHAT_ID = "-1009999999999";

// === GOOGLE SHEETS CONFIG ===
const SPREADSHEET_ID = '17YOFmDay7xBFiTnX804Hi9jLWoOsl1MiNiM2JxBF3tQ';
const SERVICE_ACCOUNT_EMAIL = 'mitra-reminder@mitra-reminder.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCey/1VIjruUBXf
Hx+mRCavNIIQ1GHeV4Q64rSEuJZravnmHOs0/uI29fjCh6wsSo6/xgBdgQv1ZmyU
t/DCCVz2RJRkVnm6cVrMZBdym70L6ZmE+0Z8ZgGdMRec9wy5U3+2v16rvfynU032
Y2xtF5tbeCZvvqaPlJrwRIxDT7i8sUWb6VRkQNr9epL9sGtbO2My/Q6WgCPTsDWa
27LtuqAaglipUEX/cCzbeuNxpdMSJ7ILCrX3Nv9N05SbyUFSYhaFmnzkxcvqtib0
4ArBsL9HTul7RAsbD5zdEyxI2+yDoIRlml6jaH1PFj2OP1yg2QyMEoHDDBgi+w0I
9teYBdx5AgMBAAECggEAGkwrcb4XttAt8xOnLOSD6IeAU7OsWoMxS4QwQ3uDM5pV
dMGMxSvBwDrXXbXUskgNoF40wMdmeNcju7RDi4q76a+9SGmWwqTTld4skOcQNWkT
6rUnPOIyubq/z5eNNKLKl3PVRIlTzk0KL/fSpLVgXdNFwEM5N7VzPD+J3/rTm/HX
cJTa6JHyVD/1ay0wG89SHLGWAw9bABIZuSc9+X160jshp4TM/X6w+F8iBKvocAVh
vS4q75qq3XeUC63tr9sMCmxpCr1mgcF9d6eONN2Yz/mgnaFtRmc1GiiKgtqFuF4c
7HDffKQQgD4TyB4hUE0PVuICeomi2BcMsBH96b0dZQKBgQDf6kKR9SluhBMVnYWr
xx/j2fWhxzo/23y0MO0ntNKKHhVVTfboRKlBH12HYutnAhWgH4t3SLxejJrEX+vu
jg3z6sE1fmXP7zDNPsmiNs7Z4kdVsRcs8GmJXAkrEBjWnleS66tY83qVHWBbZXNF
uuzRbvOHWqhT+UtIUazt48jXLQKBgQC1jQlrgp6QckAf0aS602NgQlzcEus+INP/
w/pAgPMR/Sh9DvNWrolq4Zk5vhKkcDeUYuML2ygyU8EN0IHQL6zhG/ekgfSz9eg8
QMrwFuJaEWtoqneGMgs2hE725hllYEGDI5jGzYlEm7jj5/glfRLnsT3efzIus6nj
e6BETD8p/QKBgQDXupY6k25AeOT+LU7M6kMSPjtGi3DWdzvVS1IhsDgsM8Gv9zaM
HyLGiFaPCsHr83ksVVgEK8K4gVTXH+dqZdiRiTputIGY7UUiaXzQWWe/SiAaMk02
0cWMPmzi3VZg6BtNhNsID0SqB6x/QeXmZ6qkOPZOEQ0eIo/idDZc19n3XQKBgQCx
h1F/zMFq9B2aP7E6czzIwvv0w5c/MHC9uJC8hJurqobuCzGOQKvlVOc1XJT0MTtY
IX5teIeM9vNfo9Vck1IU6fk151I2q67FRIJtVaNPeZszRQYNtl/alnR04DpTNFW7
e5KITDH/YdrhGVNArVZQM7QRHwYePtdQt/HW90wIrQKBgBK3Q3d7UTH8PGoRxbsP
w993rlpn44UNenpna1Ny8bfUQfcpyJhqFVCJE6UIEaO3vTQuxgAzgxjPHbBX3zDo
C4hRunMQVBrv1c1S2O0Ehj3zbHMUpccq1amk4JXwns44k+Epc2OiWM+/V0w8qotW
HyFQzXCDWYXK5nA3XNavChNN
-----END PRIVATE KEY-----`;

// Mapping site -> chat ID
const SITE_MAPPING = {
  "KTN": "-4816853167",
  "BIR": "-4848895543",
  "SDK": "-4963493023",
  "LSW": "-4866526441",
  "MDN": "-4885848106",
  "PMR": "-4898138897",
  "KBJ": "-1000000000001"
};

// Tracking alarm aktif
const activeAlarms = {};

// Init Google Sheets
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

// Init Telegram Bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Init WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true, // bisa true biar jalan di background di VPS
    executablePath: "/usr/bin/google-chrome", // ganti ke path Linux
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // WAJIB untuk VPS/Ubuntu
  },
});

// === FUNGSI UNTUK GOOGLE SHEETS ===
async function initGoogleSheets() {
  try {
    await doc.useServiceAccountAuth({
      client_email: SERVICE_ACCOUNT_EMAIL,
      private_key: PRIVATE_KEY,
    });
    await doc.loadInfo();
    console.log(`✅ Google Sheets terhubung: ${doc.title}`);
    
    // Cek apakah sheet "Analysis" sudah ada, jika belum buat baru
    let sheet = doc.sheetsByTitle['Analysis'];
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: 'Analysis', 
        headerValues: [
          'Timestamp', 'Area', 'Ticket ID', 'Status', 'Jumlah Site', 
          'Site List', 'Chat ID', 'Waktu Kirim', 'Waktu Response', 
          'Lama Response', 'ETA', 'Status Response'
        ] 
      });
      console.log('✅ Sheet Analysis dibuat baru');
    }
    
    return sheet;
  } catch (error) {
    console.error('❌ Gagal konek ke Google Sheets:', error.message);
    return null;
  }
}

// Fungsi untuk menambah/mengupdate data di spreadsheet
async function updateSpreadsheet(data) {
  try {
    const sheet = await initGoogleSheets();
    if (!sheet) return false;

    // Jika ini adalah response (bukan initial notification)
    if (data.responseTime) {
      // Cari row yang sesuai berdasarkan Ticket ID dan Waktu Kirim
      const rows = await sheet.getRows();
      let targetRow = null;
      
      for (const row of rows) {
        if (row['Ticket ID'] === data.ticketId && 
            row['Waktu Kirim'] === data.sendTime.toLocaleString('id-ID') &&
            row['Status Response'] === 'MENUNGGU') {
          targetRow = row;
          break;
        }
      }
      
      if (targetRow) {
        // Update row yang sudah ada
        targetRow['Waktu Response'] = data.responseTime.toLocaleString('id-ID');
        targetRow['Lama Response'] = data.timeToRespond;
        targetRow['ETA'] = data.eta;
        targetRow['Status Response'] = 'RESPONDED';
        await targetRow.save();
        console.log('✅ Data berhasil diupdate di spreadsheet');
      } else {
        // Jika tidak ditemukan, buat row baru
        await sheet.addRow({
          'Timestamp': new Date().toISOString(),
          'Area': data.area,
          'Ticket ID': data.ticketId || 'N/A',
          'Status': data.status,
          'Jumlah Site': data.sites.length,
          'Site List': data.sites.join(', '),
          'Chat ID': data.chatId,
          'Waktu Kirim': data.sendTime.toLocaleString('id-ID'),
          'Waktu Response': data.responseTime.toLocaleString('id-ID'),
          'Lama Response': data.timeToRespond,
          'ETA': data.eta,
          'Status Response': 'RESPONDED'
        });
        console.log('✅ Data response berhasil disimpan ke spreadsheet');
      }
    } else {
      // Ini adalah initial notification - buat row baru
      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'Area': data.area,
        'Ticket ID': data.ticketId || 'N/A',
        'Status': data.status,
        'Jumlah Site': data.sites.length,
        'Site List': data.sites.join(', '),
        'Chat ID': data.chatId,
        'Waktu Kirim': data.sendTime.toLocaleString('id-ID'),
        'Waktu Response': 'MENUNGGU',
        'Lama Response': 'MENUNGGU',
        'ETA': 'MENUNGGU',
        'Status Response': 'MENUNGGU'
      });
      console.log('✅ Data notifikasi berhasil disimpan ke spreadsheet');
    }

    return true;
  } catch (error) {
    console.error('❌ Gagal simpan/update spreadsheet:', error.message);
    return false;
  }
}

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('📱 Scan QR code di atas dengan WhatsApp Anda');
});

client.on("ready", () => {
  console.log("✅ WhatsApp Client is ready!");
});

client.on("auth_failure", (error) => {
  console.error("❌ Authentication failed:", error);
});

client.on("disconnected", (reason) => {
  console.log("❌ Client was logged out:", reason);
});

// ========== HANDLE BALASAN DI TELEGRAM ==========
bot.on("message", async (msg) => {
  const chatId = msg.chat.id.toString();
  const textRaw = msg.text?.trim();
  const messageTime = new Date(msg.date * 1000);

  if (!textRaw) {
    console.log(`⚠️ Pesan dari chat ${chatId} kosong atau bukan teks, dilewati`);
    return;
  }

  const text = textRaw.toLowerCase().replace(/[^\w\s]/gi, '');

  console.log(`📩 Pesan dari Telegram ${chatId}: "${text}" (original: "${msg.text}")`);

  // Cari semua alarm aktif untuk chat ini
  const alarmsInChat = Object.entries(activeAlarms).filter(([key, data]) => data.chatId === chatId);
  
  console.log(`🔍 Active alarms untuk chat ${chatId}: ${alarmsInChat.length}`);

  // Regex: harus "oke" diikuti angka (ETA)
  const match = text.match(/^oke\s*(\d+)$/i);

  if (match && alarmsInChat.length > 0) {
    const eta = match[1];
    console.log(`✅ Pesan valid "oke + ETA" terdeteksi: ${eta} menit dari chat ${chatId}`);

    // Hentikan semua alarm di chat ini
    for (const [key, data] of alarmsInChat) {
      clearInterval(data.intervalId);
      
      // Hitung waktu respons
      const responseTime = new Date();
      const timeToRespond = Math.round((responseTime - data.firstNotificationTime) / 1000);
      const minutes = Math.floor(timeToRespond / 60);
      const seconds = timeToRespond % 60;
      
      const timeToRespondFormatted = `${minutes} menit ${seconds} detik`;
      
      // Update data untuk spreadsheet
      const analysisData = {
        area: data.area,
        ticketId: data.ticketId,
        status: data.status,
        sites: data.sites,
        chatId: data.chatId,
        sendTime: data.firstNotificationTime,
        responseTime: responseTime,
        timeToRespond: timeToRespondFormatted,
        eta: eta + ' menit',
        responseStatus: 'RESPONDED'
      };
      
      // Update spreadsheet (bukan tambah baru)
      await updateSpreadsheet(analysisData);
      
      // Kirim konfirmasi ke WA
      try {
        await client.sendMessage(
          data.waSender,
          `✅ *MITRA SUDAH MERESPONS!*\n\n` +
          `Pesan Asli:\n${data.originalMessage}\n\n` +
          `Area: ${data.area}\n` +
          `Ticket: ${data.ticketId || 'N/A'}\n` +
          `ETA perjalanan: ${eta} menit\n` +
          `Waktu notifikasi pertama: ${data.firstNotificationTime.toLocaleString('id-ID')}\n` +
          `Waktu respons: ${responseTime.toLocaleString('id-ID')}\n` +
          `Lama waktu respons: ${timeToRespondFormatted}\n` +
          `Status: Mitra sudah balas '${msg.text}', alarm dihentikan.` +
          `\n\n📊 Data sudah tercatat di spreadsheet analysis`
        );
        console.log(`📤 Konfirmasi terkirim ke WA ${data.waSender} untuk area ${data.area}`);
      } catch (waError) {
        console.error("❌ Gagal kirim ke WA:", waError.message);
      }
      
      delete activeAlarms[key];
    }

    // Kirim konfirmasi ke Telegram
    await bot.sendMessage(chatId, `✅ Alarm sudah di-acknowledge dengan '${msg.text}'. Notifikasi dihentikan. Data sudah dicatat.`);

  } else if (!match && alarmsInChat.length > 0) {
    console.log(`⚠️ Pesan tidak valid, harus sertakan ETA. Contoh: "oke 30"`);
    await bot.sendMessage(chatId, "⚠️ Mohon sertakan ETA perjalanan. Contoh: 'oke 30'");
  } else if (alarmsInChat.length === 0) {
    console.log(`⚠️ Pesan diterima tapi tidak ada alarm aktif di chat ${chatId}`);
    await bot.sendMessage(chatId, "ℹ️ Tidak ada alarm aktif untuk di-acknowledge di grup ini.");
  }
});

// ========== HANDLE ERROR TELEGRAM BOT ==========
bot.on("polling_error", (error) => {
  console.error("❌ Telegram polling error:", error.message);
});

// ========== HANDLE PESAN DARI WHATSAPP ==========
client.on("message", async (msg) => {
  const text = msg.body;
  const from = msg.from;
  console.log(`📩 Pesan dari WA: ${text} dari ${from}`);

  const parsed = parseMessage(text);

  if (parsed && parsed.sites.length > 0) {
    // Tentukan area berdasarkan site pertama yang ditemukan
    const firstSiteCode = parsed.sites[0].match(/[A-Za-z]{3}/);
    const areaCode = firstSiteCode ? firstSiteCode[0].toUpperCase() : "UNKNOWN";
    const chatId = SITE_MAPPING[areaCode] || DEFAULT_CHAT_ID;
    const areaName = getAreaName(areaCode);

    // Buat key unik untuk alarm
    const alarmKey = `${chatId}_${parsed.ticketId || Date.now()}`;

    try {
      // Hentikan alarm sebelumnya untuk ticket yang sama di chat yang sama
      if (activeAlarms[alarmKey]) {
        clearInterval(activeAlarms[alarmKey].intervalId);
        delete activeAlarms[alarmKey];
      }

      // Kirim notifikasi lengkap ke Telegram
      const firstNotificationTime = new Date();
      const messageText = `
🚨 Trouble Ticket 🚨
Cluster: <b>${parsed.cluster || "Unknown"}</b>

<b>Area:</b> ${areaName} (${areaCode})
<b>Sites Terdampak:</b> ${parsed.sites.length} site

<b>Detail Sites:</b>
${parsed.sites.map((s) => " - " + s).join("\n")}

<b>Status:</b> ${parsed.status}
<b>Ticket ID:</b> ${parsed.ticketId || "N/A"}
<b>Waktu Notifikasi:</b> ${firstNotificationTime.toLocaleString('id-ID')}

<b>Pesan Lengkap:</b>
<code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>

⚠️ <b>Silakan konfirmasi dengan membalas 'oke + ETA', contoh: oke 30</b>
`;
      await bot.sendMessage(chatId, messageText, { parse_mode: "HTML" });

      // Simpan data awal ke spreadsheet
      const analysisData = {
        area: areaName,
        ticketId: parsed.ticketId,
        status: parsed.status,
        sites: parsed.sites,
        chatId: chatId,
        sendTime: firstNotificationTime,
        responseStatus: 'MENUNGGU'
      };
      
      await updateSpreadsheet(analysisData);

      // Konfirmasi balik ke WA
      await client.sendMessage(
        from,
        `✅ *PESAN TERKIRIM KE MITRA*\n\n` +
        `Area: ${areaName} (${areaCode})\n` +
        `Jumlah Site: ${parsed.sites.length} site\n` +
        `Ticket: ${parsed.ticketId || "N/A"}\n` +
        `Status: Terkirim ke grup Telegram mitra\n` +
        `Chat ID: ${chatId}\n` +
        `Waktu Notifikasi: ${firstNotificationTime.toLocaleString('id-ID')}\n\n` +
        `📋 Notifikasi akan dikirim setiap menit ke grup mitra hingga mereka balas 'oke + ETA'.\n` +
        `📊 Data sudah tercatat di spreadsheet analysis`
      );

      // Setup interval spam
      const intervalId = setInterval(async () => {
        if (activeAlarms[alarmKey]) {
          try {
            const elapsedMinutes = Math.floor((new Date() - activeAlarms[alarmKey].startTime) / 60000);
            const timeSinceFirstNotification = Math.floor((new Date() - activeAlarms[alarmKey].firstNotificationTime) / 1000);
            const minutesSinceFirst = Math.floor(timeSinceFirstNotification / 60);
            const secondsSinceFirst = timeSinceFirstNotification % 60;
            
            await bot.sendMessage(
              chatId,
              `🔔 *Pengingat Trouble Ticket!*\n\n` +
              `Area: ${areaName} (${areaCode})\n` +
              `Sudah ${elapsedMinutes} menit sejak alarm terkirim\n` +
              `Sudah ${minutesSinceFirst} menit ${secondsSinceFirst} detik sejak notifikasi pertama\n\n` +
              `Silakan balas 'oke + ETA' untuk menghentikan notifikasi.\n\n` +
              `Ticket: ${parsed.ticketId || "N/A"}\n` +
              `Status: ${parsed.status}\n` +
              `Waktu Notifikasi Pertama: ${activeAlarms[alarmKey].firstNotificationTime.toLocaleString('id-ID')}\n\n` +
              `Sites Terdampak: ${parsed.sites.join(', ')}`,
              { parse_mode: "Markdown" }
            );
          } catch (err) {
            console.error("Gagal kirim notifikasi spam:", err.message);
          }
        } else {
          clearInterval(intervalId);
        }
      }, 60000);

      // Simpan alarm aktif
      activeAlarms[alarmKey] = {
        intervalId,
        startTime: new Date(),
        firstNotificationTime: firstNotificationTime,
        area: areaName,
        ticketId: parsed.ticketId,
        waSender: from,
        chatId: chatId,
        originalMessage: text,
        sites: parsed.sites,
        status: parsed.status
      };

    } catch (err) {
      console.error("❌ Gagal kirim telegram:", err.message);
      await client.sendMessage(
        from,
        `❌ *GAGAL MENGIRIM KE MITRA*\n\nArea: ${areaName} (${areaCode})\nError: ${err.message}`
      );
    }
  }
});

// ========== PARSER PESAN WA ==========
function parseMessage(text) {
  try {
    const clusterMatch = text.match(/\[(.*?)\]/);
    const cluster = clusterMatch ? clusterMatch[1] : "Unknown";

    const siteIdMatches = text.match(/\d{2}[A-Za-z]{3}\d{4}(?:\(\d{2}[A-Za-z]{3}\d{3}\))?/g);
    const sites = siteIdMatches || [];

    const statusMatch = text.match(/- (DOWN|UP|MAJOR|MINOR)/i);
    const status = statusMatch ? statusMatch[1].toUpperCase() : "UNKNOWN";

    let ticketId = "N/A";
    const lines = text.split("\n");
    for (const line of lines) {
      const ticketMatch = line.match(/FLP-INC-\d{8}-\d+/);
      if (ticketMatch) {
        ticketId = ticketMatch[0];
        break;
      }
    }

    return { sites, ticketId, cluster, status };
  } catch (e) {
    console.error("Parsing gagal:", e);
    return null;
  }
}

// ========== GET AREA NAME ==========
function getAreaName(areaCode) {
  const areaNames = {
    "KTN": "Aceh Tenggara",
    "BIR": "Biuren", 
    "SDK": "Site SDK",
    "LSW": "Lhokseumawe",
    "MDN": "Medan",
    "PMR": "Simalungun",
    "KBJ": "Site KBJ"
  };
  return areaNames[areaCode] || areaCode;
}

// ========== DEBUG AKTIF ALARM ==========
setInterval(() => {
  console.log(`\n🔍 === STATUS ALARM === (${new Date().toLocaleString('id-ID')})`);
  console.log(`Alarm aktif: ${Object.keys(activeAlarms).length}`);

  if (Object.keys(activeAlarms).length === 0) {
    console.log("   - Tidak ada alarm aktif");
  } else {
    for (const [key, data] of Object.entries(activeAlarms)) {
      const elapsedMinutes = Math.floor((new Date() - data.startTime) / 60000);
      const timeSinceFirstNotification = Math.floor((new Date() - data.firstNotificationTime) / 1000);
      const minutesSinceFirst = Math.floor(timeSinceFirstNotification / 60);
      const secondsSinceFirst = timeSinceFirstNotification % 60;
      
      console.log(`   - Key ${key}: ${data.area} (${data.ticketId})`);
      console.log(`     Sites: ${data.sites.length} site`);
      console.log(`     WA: ${data.waSender}`);
      console.log(`     Waktu aktif: ${elapsedMinutes} menit`);
      console.log(`     Waktu sejak notifikasi pertama: ${minutesSinceFirst} menit ${secondsSinceFirst} detik`);
    }
  }
  console.log("========================\n");
}, 30000);

client.initialize();

// ========== GRACEFUL SHUTDOWN ==========
process.on("SIGINT", async () => {
  console.log("\n🛑 Menghentikan aplikasi...");
  for (const [key, data] of Object.entries(activeAlarms)) {
    clearInterval(data.intervalId);
  }
  bot.stopPolling();
  await client.destroy();
  process.exit(0);
});

