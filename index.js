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

// Mapping site -> chat ID (Level 1 - Mitra)
const SITE_MAPPING_LEVEL1 = {
  "KTN": "-4816853167", // Aceh Tenggara (mencakup KTN, TKN)
  "TKN": "-4816853167", // Aceh Tenggara (mencakup KTN, TKN)
  "BIR": "-4848895543", // Biuren
  "SDK": "-4963493023", // Dairi
  "LSW": "-4866526441", // Lhoksuemawe
  "MDN": "-4885848106", // Medan
  "PMR": "-4898138897", // Simalungun
  "TRT": "-4837154974", // Tarutung
  "SGI": "-4813092648", // Pidie
  "LBP": "-4845301434", // Deli Serdang
  "RAP": "-4852430241", // Labuhan Batu
  "TBT": "-4853289355", // Tebing
  "SDB": "-4853289355", // Tebing
  "TEB": "-1000000000002" // Tebing Tinggi (daerah baru)
};

// Mapping eskalasi Level 2 & 3 (Supervisor & Manager)
const ESCALATION_MAPPING = {
  "LEVEL2": "-4975763968", // Supervisor Group
  "LEVEL3": "-4894095484"  // Manager Group
};

// Chat khusus untuk monitoring TT aktif
const TT_MONITORING_CHAT_ID = "-4801793040"; // Ganti dengan chat ID monitoring TT

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
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// === FUNGSI BANTUAN ===
function formatWIB(dateObj) {
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (7 * 60 * 60000));
  const dd = String(wib.getDate()).padStart(2, '0');
  const mm = String(wib.getMonth() + 1).padStart(2, '0');
  const yyyy = wib.getFullYear();
  const hh = String(wib.getHours()).padStart(2, '0');
  const min = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

function getCurrentMonthSheetName() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `Data_${month}_${year}`;
}

// === FUNGSI UNTUK GOOGLE SHEETS ===
async function initGoogleSheets() {
  try {
    await doc.useServiceAccountAuth({
      client_email: SERVICE_ACCOUNT_EMAIL,
      private_key: PRIVATE_KEY,
    });
    await doc.loadInfo();
    console.log(`✅ Google Sheets terhubung: ${doc.title}`);
    return true;
  } catch (error) {
    console.error('❌ Gagal konek ke Google Sheets:', error.message);
    return false;
  }
}

async function getOrCreateMonthlySheet() {
  try {
    const sheetName = getCurrentMonthSheetName();
    let sheet = doc.sheetsByTitle[sheetName];
    
    if (!sheet) {
      sheet = await doc.addSheet({
        title: sheetName,
        headerValues: [
          'Timestamp', 'Area', 'Status', 'Jumlah Site',
          'Site List', 'Chat ID', 'Waktu Kirim', 'Waktu Response',
          'Lama Response', 'ETA', 'Status Response', 'Eskalasi Level',
          'Notifikasi TT'
        ]
      });
      console.log(`✅ Sheet ${sheetName} dibuat baru`);
    }
    
    return sheet;
  } catch (error) {
    console.error('❌ Gagal buat/buka sheet bulanan:', error.message);
    return null;
  }
}

async function updateSpreadsheet(data) {
  try {
    if (!(await initGoogleSheets())) return false;

    const sheet = await getOrCreateMonthlySheet();
    if (!sheet) return false;

    // Jika ini adalah response (bukan initial notification)
    if (data.responseTime) {
      const rows = await sheet.getRows();
      let targetRow = null;

      for (const row of rows) {
        if (row['Site List'] === data.sites.join(', ') &&
            row['Waktu Kirim'] === formatWIB(data.sendTime) &&
            row['Status Response'] === 'MENUNGGU') {
          targetRow = row;
          break;
        }
      }

      if (targetRow) {
        targetRow['Waktu Response'] = formatWIB(data.responseTime);
        targetRow['Lama Response'] = data.timeToRespond;
        targetRow['ETA'] = data.eta;
        targetRow['Status Response'] = 'RESPONDED';
        targetRow['Eskalasi Level'] = data.escalationLevel || 'LEVEL1';
        targetRow['Notifikasi TT'] = data.ttNotification || 'NO';
        await targetRow.save();
        console.log('✅ Data berhasil diupdate di spreadsheet');
      } else {
        await sheet.addRow({
          'Timestamp': formatWIB(new Date()),
          'Area': data.area,
          'Status': data.status,
          'Jumlah Site': data.sites.length,
          'Site List': data.sites.join(', '),
          'Chat ID': data.chatId,
          'Waktu Kirim': formatWIB(data.sendTime),
          'Waktu Response': formatWIB(data.responseTime),
          'Lama Response': data.timeToRespond,
          'ETA': data.eta,
          'Status Response': 'RESPONDED',
          'Eskalasi Level': data.escalationLevel || 'LEVEL1',
          'Notifikasi TT': data.ttNotification || 'NO'
        });
        console.log('✅ Data response berhasil disimpan ke spreadsheet');
      }
    } else {
      await sheet.addRow({
        'Timestamp': formatWIB(new Date()),
        'Area': data.area,
        'Status': data.status,
        'Jumlah Site': data.sites.length,
        'Site List': data.sites.join(', '),
        'Chat ID': data.chatId,
        'Waktu Kirim': formatWIB(data.sendTime),
        'Waktu Response': 'MENUNGGU',
        'Lama Response': 'MENUNGGU',
        'ETA': 'MENUNGGU',
        'Status Response': 'MENUNGGU',
        'Eskalasi Level': data.escalationLevel || 'LEVEL1',
        'Notifikasi TT': data.ttNotification || 'NO'
      });
      console.log('✅ Data notifikasi berhasil disimpan ke spreadsheet');
    }

    return true;
  } catch (error) {
    console.error('❌ Gagal simpan/update spreadsheet:', error.message);
    return false;
  }
}

// Fungsi untuk mengirim notifikasi TT SEDERHANA (tanpa detail site)
async function sendSimpleTTNotification(alarmData, level = "LEVEL1") {
  try {
    const messageText = `
🚨 *TROUBLE TICKET - ${level}* 🚨

📍 *Area:* ${alarmData.area}
🔧 *Status:* ${alarmData.status}
📊 *Jumlah Site:* ${alarmData.sites.length} site
⏰ *Waktu:* ${formatWIB(new Date())}

⚠️ *Tindakan Required:*
Balas pesan ini dengan format: *oke ETA*
Contoh: *oke 30* (untuk ETA 30 menit)

📋 *Sistem Eskalasi:*
- Level 1: Notifikasi ke mitra
- Level 2: Eskalasi ke supervisor setelah 5 menit
- Level 3: Eskalasi ke manager setelah 25 menit

🔒 *Informasi detail site tersimpan di database internal*
`;

    await bot.sendMessage(alarmData.chatId, messageText, { parse_mode: "Markdown" });
    console.log(`✅ Notifikasi TT sederhana terkirim ke ${alarmData.chatId}`);
    return true;
  } catch (error) {
    console.error('❌ Gagal kirim notifikasi TT sederhana:', error.message);
    return false;
  }
}

// Fungsi untuk mengirim notifikasi eskalasi SEDERHANA
async function sendSimpleEscalationNotification(alarmKey, escalationLevel) {
  const alarmData = activeAlarms[alarmKey];
  if (!alarmData) {
    console.log(`❌ Alarm data tidak ditemukan untuk key: ${alarmKey}`);
    return;
  }

  const targetChatId = ESCALATION_MAPPING[escalationLevel];
  if (!targetChatId) {
    console.log(`❌ Chat ID tidak ditemukan untuk level: ${escalationLevel}`);
    return;
  }

  try {
    const timeSinceFirst = Math.floor((new Date() - alarmData.firstNotificationTime) / 1000);
    const minutesSinceFirst = Math.floor(timeSinceFirst / 60);
    const secondsSinceFirst = timeSinceFirst % 60;

    const messageText = `
🚨 *ESKALASI TROUBLE TICKET* 🚨
*Level:* ${escalationLevel}

📋 *Informasi Trouble:*
- Area: ${alarmData.area}
- Status: ${alarmData.status}
- Jumlah Site: ${alarmData.sites.length} site
- Durasi: ${minutesSinceFirst} menit ${secondsSinceFirst} detik

⚠️ *Tindakan Required:*
Mitra belum merespons dalam waktu yang ditentukan. Segera follow up!

⏰ *Notifikasi akan dikirim setiap 30 detik hingga di-acknowledge*

🔒 *Detail site lengkap tersedia di database internal*
`;

    await bot.sendMessage(targetChatId, messageText, { parse_mode: "Markdown" });
    
    // Update spreadsheet dengan level eskalasi (data lengkap)
    const analysisData = {
      area: alarmData.area,
      status: alarmData.status,
      sites: alarmData.sites,
      chatId: targetChatId,
      sendTime: new Date(),
      escalationLevel: escalationLevel,
      ttNotification: 'YES'
    };
    
    await updateSpreadsheet(analysisData);
    
    console.log(`✅ Notifikasi eskalasi ${escalationLevel} terkirim ke ${targetChatId}`);
    
    // Update level eskalasi di alarm data
    alarmData.currentEscalationLevel = escalationLevel;
    alarmData.lastEscalationTime = new Date();
    
    // Setup notifikasi 30 detik untuk Level 1 dan 2
    if (escalationLevel === 'LEVEL1' || escalationLevel === 'LEVEL2') {
      setupEscalationNotificationInterval(alarmKey, escalationLevel);
    }
    
  } catch (error) {
    console.error(`❌ Gagal kirim eskalasi ${escalationLevel}:`, error.message);
  }
}

// Fungsi untuk mengirim notifikasi monitoring TT SEDERHANA
async function sendSimpleTTMonitoringNotification() {
  try {
    const activeAlarmsCount = Object.keys(activeAlarms).length;
    
    if (activeAlarmsCount === 0) {
      const messageText = `📊 *MONITORING TROUBLE TICKET*\n\n` +
                         `🟢 *TIDAK ADA TT AKTIF*\n\n` +
                         `⏰ Update: ${formatWIB(new Date())}\n` +
                         `Semua trouble ticket telah ditangani.`;
      
      await bot.sendMessage(TT_MONITORING_CHAT_ID, messageText, { parse_mode: "Markdown" });
    } else {
      let messageText = `📊 *MONITORING TROUBLE TICKET*\n\n` +
                       `🔴 *ADA ${activeAlarmsCount} TT AKTIF*\n\n`;
      
      Object.entries(activeAlarms).forEach(([key, data], index) => {
        const timeSinceFirst = Math.floor((new Date() - data.firstNotificationTime) / 1000);
        const minutesSinceFirst = Math.floor(timeSinceFirst / 60);
        const secondsSinceFirst = timeSinceFirst % 60;
        
        messageText += `*TT ${index + 1}:*\n`;
        messageText += `• Area: ${data.area}\n`;
        messageText += `• Level: ${data.currentEscalationLevel}\n`;
        messageText += `• Jumlah Site: ${data.sites.length}\n`;
        messageText += `• Durasi: ${minutesSinceFirst}m ${secondsSinceFirst}s\n`;
        messageText += `• Status: Menunggu Response\n\n`;
      });
      
      messageText += `⏰ Update: ${formatWIB(new Date())}\n`;
      messageText += `_Gunakan command /status untuk detail lengkap_\n`;
      messageText += `🔒 _Detail site tersimpan di database internal_`;
      
      await bot.sendMessage(TT_MONITORING_CHAT_ID, messageText, { parse_mode: "Markdown" });
    }
    
    console.log(`✅ Notifikasi monitoring TT terkirim ke ${TT_MONITORING_CHAT_ID}`);
    return true;
  } catch (error) {
    console.error('❌ Gagal kirim notifikasi monitoring TT:', error.message);
    return false;
  }
}

// Setup interval untuk notifikasi per 15 detik (SEDERHANA)
function setupSimpleNotificationInterval(alarmKey, chatId, areaName, areaCode, sites, status, firstNotificationTime) {
  return setInterval(async () => {
    if (activeAlarms[alarmKey]) {
      try {
        const timeSinceFirstNotification = Math.floor((new Date() - firstNotificationTime) / 1000);
        const minutesSinceFirst = Math.floor(timeSinceFirstNotification / 60);
        const secondsSinceFirst = timeSinceFirstNotification % 60;

        await bot.sendMessage(
          chatId,
          `🔔 *PENGINGAT TROUBLE TICKET!*\n\n` +
          `Area: ${areaName}\n` +
          `Sudah ${minutesSinceFirst} menit ${secondsSinceFirst} detik\n\n` +
          `Silakan balas *oke ETA* untuk menghentikan notifikasi\n\n` +
          `Status: ${status}\n` +
          `Waktu Notifikasi: ${formatWIB(firstNotificationTime)}\n\n` +
          `🔒 *Detail site tersimpan aman di database*`,
          { parse_mode: "Markdown" }
        );
        
        console.log(`✅ Notifikasi 15 detik terkirim untuk ${areaName}`);
      } catch (err) {
        console.error("❌ Gagal kirim notifikasi 15 detik:", err.message);
      }
    }
  }, 15000); // Setiap 15 detik
}

// Setup interval untuk notifikasi eskalasi per 30 detik (SEDERHANA)
function setupEscalationNotificationInterval(alarmKey, escalationLevel) {
  const alarmData = activeAlarms[alarmKey];
  if (!alarmData) return;

  // Hentikan interval sebelumnya jika ada
  if (alarmData.escalationNotificationInterval) {
    clearInterval(alarmData.escalationNotificationInterval);
  }

  const targetChatId = ESCALATION_MAPPING[escalationLevel];
  if (!targetChatId) return;

  alarmData.escalationNotificationInterval = setInterval(async () => {
    if (activeAlarms[alarmKey] && activeAlarms[alarmKey].currentEscalationLevel === escalationLevel) {
      try {
        const timeSinceFirst = Math.floor((new Date() - alarmData.firstNotificationTime) / 1000);
        const minutesSinceFirst = Math.floor(timeSinceFirst / 60);
        const secondsSinceFirst = timeSinceFirst % 60;

        const messageText = `
🔔 *NOTIFIKASI ESKALASI ${escalationLevel} - 30 DETIK*

📋 *Informasi Trouble:*
- Area: ${alarmData.area}
- Status: ${alarmData.status}
- Jumlah Site: ${alarmData.sites.length}
- Durasi: ${minutesSinceFirst}m ${secondsSinceFirst}s

⚠️ *Tindakan Required:*
Balas *oke ETA* untuk menghentikan notifikasi

⏰ Waktu: ${formatWIB(new Date())}

🔒 *Detail site lengkap di database internal*
`;

        await bot.sendMessage(targetChatId, messageText, { parse_mode: "Markdown" });
        console.log(`✅ Notifikasi 30 detik eskalasi ${escalationLevel} terkirim`);
      } catch (err) {
        console.error(`❌ Gagal kirim notifikasi 30 detik ${escalationLevel}:`, err.message);
      }
    }
  }, 30000); // Setiap 30 detik
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

  // Handle command /status untuk monitoring
  if (text === '/status' && chatId === TT_MONITORING_CHAT_ID) {
    await sendSimpleTTMonitoringNotification();
    return;
  }

  console.log(`📩 Pesan dari Telegram ${chatId}: "${text}" (original: "${msg.text}")`);

  // Cari semua alarm aktif untuk chat ini
  const alarmsInChat = Object.entries(activeAlarms).filter(([key, data]) => {
    return data.chatId === chatId || 
           (data.currentEscalationLevel === 'LEVEL2' && ESCALATION_MAPPING.LEVEL2 === chatId) || 
           (data.currentEscalationLevel === 'LEVEL3' && ESCALATION_MAPPING.LEVEL3 === chatId);
  });

  console.log(`🔍 Active alarms untuk chat ${chatId}: ${alarmsInChat.length}`);

  // Regex: harus "oke" diikuti angka (ETA)
  const match = text.match(/^oke\s*(\d+)$/i);

  if (match && alarmsInChat.length > 0) {
    const eta = match[1];
    console.log(`✅ Pesan valid "oke + ETA" terdeteksi: ${eta} menit dari chat ${chatId}`);

    // Hentikan semua alarm yang sesuai di chat ini
    for (const [key, data] of alarmsInChat) {
      if (data.intervalId) clearInterval(data.intervalId);
      if (data.escalationTimeout) clearTimeout(data.escalationTimeout);
      if (data.notificationInterval) clearInterval(data.notificationInterval);
      if (data.level3Timeout) clearTimeout(data.level3Timeout);
      if (data.escalationNotificationInterval) clearInterval(data.escalationNotificationInterval);

      // Hitung waktu respons
      const responseTime = new Date();
      const timeToRespond = Math.round((responseTime - data.firstNotificationTime) / 1000);
      const minutes = Math.floor(timeToRespond / 60);
      const seconds = timeToRespond % 60;
      const timeToRespondFormatted = `${minutes} menit ${seconds} detik`;

      // Update data untuk spreadsheet (DATA LENGKAP)
      const analysisData = {
        area: data.area,
        status: data.status,
        sites: data.sites, // ✅ Site detail tetap disimpan di sheets
        chatId: data.chatId,
        sendTime: data.firstNotificationTime,
        responseTime: responseTime,
        timeToRespond: timeToRespondFormatted,
        eta: eta + ' menit',
        escalationLevel: data.currentEscalationLevel || 'LEVEL1',
        ttNotification: data.currentEscalationLevel === 'LEVEL2' || data.currentEscalationLevel === 'LEVEL3' ? 'YES' : 'NO'
      };

      // Update spreadsheet
      await updateSpreadsheet(analysisData);

      // Kirim konfirmasi ke WA
      try {
        await client.sendMessage(
          data.waSender,
          `✅ *MITRA SUDAH MERESPONS!*\n\n` +
          `Pesan Asli:\n${data.originalMessage}\n\n` +
          `Area: ${data.area}\n` +
          `ETA perjalanan: ${eta} menit\n` +
          `Waktu notifikasi pertama: ${formatWIB(data.firstNotificationTime)}\n` +
          `Waktu respons: ${formatWIB(responseTime)}\n` +
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
    await bot.sendMessage(chatId, `✅ Alarm sudah di-acknowledge dengan '${msg.text}'. Notifikasi dihentikan. Data sudah dicatat. Selamat bekerja dan perhatikan K3`);

    // Update monitoring TT
    await sendSimpleTTMonitoringNotification();
    
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
    let areaCode = firstSiteCode ? firstSiteCode[0].toUpperCase() : "UNKNOWN";
    
    // Handle khusus untuk Aceh Tenggara (KTN dan TKN)
    if (areaCode === 'TKN') {
      areaCode = 'KTN'; // Mapping TKN ke KTN (Aceh Tenggara)
    }
    
    const chatId = SITE_MAPPING_LEVEL1[areaCode] || DEFAULT_CHAT_ID;
    const areaName = getAreaName(areaCode);

    // Buat key unik untuk alarm
    const alarmKey = `${chatId}_${Date.now()}`;

    try {
      // Hentikan alarm sebelumnya untuk site yang sama di chat yang sama (jika ada)
      const existingAlarmKey = Object.keys(activeAlarms).find(key => 
        key.startsWith(chatId) && 
        JSON.stringify(activeAlarms[key].sites) === JSON.stringify(parsed.sites)
      );
      
      if (existingAlarmKey) {
        if (activeAlarms[existingAlarmKey].intervalId) clearInterval(activeAlarms[existingAlarmKey].intervalId);
        if (activeAlarms[existingAlarmKey].escalationTimeout) clearTimeout(activeAlarms[existingAlarmKey].escalationTimeout);
        if (activeAlarms[existingAlarmKey].notificationInterval) clearInterval(activeAlarms[existingAlarmKey].notificationInterval);
        if (activeAlarms[existingAlarmKey].escalationNotificationInterval) clearInterval(activeAlarms[existingAlarmKey].escalationNotificationInterval);
        delete activeAlarms[existingAlarmKey];
        console.log(`🔄 Alarm sebelumnya untuk site yang sama dihentikan`);
      }

      // Simpan data awal ke spreadsheet (DATA LENGKAP)
      const firstNotificationTime = new Date();
      const analysisData = {
        area: areaName,
        status: parsed.status,
        sites: parsed.sites, // ✅ Site detail tetap disimpan di sheets
        chatId: chatId,
        sendTime: firstNotificationTime,
        escalationLevel: 'LEVEL1',
        ttNotification: 'NO'
      };

      await updateSpreadsheet(analysisData);

      // Kirim notifikasi SEDERHANA ke Telegram (TANPA DETAIL SITE)
      await sendSimpleTTNotification({
        area: areaName,
        status: parsed.status,
        sites: parsed.sites,
        chatId: chatId,
        firstNotificationTime: firstNotificationTime
      }, 'LEVEL1');

      // Konfirmasi balik ke WA
      await client.sendMessage(
        from,
        `✅ *PESAN TERKIRIM KE MITRA*\n\n` +
        `Area: ${areaName} (${areaCode})\n` +
        `Jumlah Site: ${parsed.sites.length} site\n` +
        `Status: Terkirim ke grup Telegram mitra\n` +
        `Chat ID: ${chatId}\n` +
        `Waktu Notifikasi: ${formatWIB(firstNotificationTime)}\n\n` +
        `📋 Sistem eskalasi aktif:\n` +
        `• Level 1: Notifikasi ke mitra (sekarang)\n` +
        `• Level 2: Eskalasi ke supervisor setelah 5 menit\n` +
        `• Level 3: Eskalasi ke manager setelah 25 menit\n\n` +
        `⚠️ Notifikasi akan berhenti otomatis saat mitra balas 'oke + ETA'\n` +
        `📊 Data sudah tercatat di spreadsheet analysis`
      );

      // Setup interval spam setiap 15 detik (SEDERHANA)
      const notificationInterval = setupSimpleNotificationInterval(
        alarmKey, chatId, areaName, areaCode, parsed.sites, parsed.status, firstNotificationTime
      );

      // Setup eskalasi otomatis
      const escalationTimeout = setTimeout(async () => {
        if (activeAlarms[alarmKey]) {
          console.log(`⏰ Eskalasi Level 2 untuk ${areaName}`);
          await sendSimpleEscalationNotification(alarmKey, 'LEVEL2');
          
          // Eskalasi ke Level 3 setelah 20 menit tambahan (total 25 menit)
          const level3Timeout = setTimeout(async () => {
            if (activeAlarms[alarmKey]) {
              console.log(`⏰ Eskalasi Level 3 untuk ${areaName}`);
              await sendSimpleEscalationNotification(alarmKey, 'LEVEL3');
            }
          }, 20 * 60 * 1000); // 20 menit setelah Level 2
          
          // Simpan timeout untuk Level 3
          activeAlarms[alarmKey].level3Timeout = level3Timeout;
        }
      }, 5 * 60 * 1000); // 5 menit untuk Level 2

      // Simpan alarm aktif
      activeAlarms[alarmKey] = {
        notificationInterval,
        escalationTimeout,
        startTime: new Date(),
        firstNotificationTime: firstNotificationTime,
        area: areaName,
        waSender: from,
        chatId: chatId,
        originalMessage: text,
        sites: parsed.sites,
        status: parsed.status,
        currentEscalationLevel: 'LEVEL1'
      };

      // Kirim notifikasi monitoring TT
      await sendSimpleTTMonitoringNotification();

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

    return { sites, cluster, status };
  } catch (e) {
    console.error("Parsing gagal:", e);
    return null;
  }
}

// ========== GET AREA NAME ==========
function getAreaName(areaCode) {
  const areaNames = {
    "KTN": "Aceh Tenggara",
    "TKN": "Aceh Tenggara",
    "BIR": "Biuren",
    "SDK": "Dairi",
    "LSW": "Lhokseumawe",
    "MDN": "Medan",
    "PMR": "Simalungun",
    "TRT": "Tapanuli",
    "SGI": "Pidie",
    "KBJ": "Site KBJ",
    "LBP": "Deli Serdang",
    "RAP": "Labuhan Batu",
    "TBT": "Tebing",
    "SDB": "Tebing"
  };
  return areaNames[areaCode] || areaCode;
}

// ========== DEBUG AKTIF ALARM ==========
setInterval(() => {
  console.log(`\n🔍 === STATUS ALARM === (${formatWIB(new Date())})`);
  console.log(`Alarm aktif: ${Object.keys(activeAlarms).length}`);

  if (Object.keys(activeAlarms).length === 0) {
    console.log("   - Tidak ada alarm aktif");
  } else {
    for (const [key, data] of Object.entries(activeAlarms)) {
      const elapsedMinutes = Math.floor((new Date() - data.startTime) / 60000);
      const timeSinceFirstNotification = Math.floor((new Date() - data.firstNotificationTime) / 1000);
      const minutesSinceFirst = Math.floor(timeSinceFirstNotification / 60);
      const secondsSinceFirst = timeSinceFirstNotification % 60;

      console.log(`   - Key ${key}: ${data.area}`);
      console.log(`     Sites: ${data.sites.length} site`);
      console.log(`     Sites List: ${data.sites.join(', ')}`);
      console.log(`     WA: ${data.waSender}`);
      console.log(`     Level Eskalasi: ${data.currentEscalationLevel}`);
      console.log(`     Waktu aktif: ${elapsedMinutes} menit`);
      console.log(`     Waktu sejak notifikasi pertama: ${minutesSinceFirst} menit ${secondsSinceFirst} detik`);
    }
  }
  console.log("========================\n");
}, 30000);

// ========== MONITORING TT SETIAP 1 MENIT ==========
setInterval(async () => {
  if (Object.keys(activeAlarms).length > 0) {
    await sendSimpleTTMonitoringNotification();
  }
}, 60000); // Setiap 1 menit

client.initialize();

// ========== GRACEFUL SHUTDOWN ==========
process.on("SIGINT", async () => {
  console.log("\n🛑 Menghentikan aplikasi...");
  for (const [key, data] of Object.entries(activeAlarms)) {
    if (data.intervalId) clearInterval(data.intervalId);
    if (data.escalationTimeout) clearTimeout(data.escalationTimeout);
    if (data.notificationInterval) clearInterval(data.notificationInterval);
    if (data.level3Timeout) clearTimeout(data.level3Timeout);
    if (data.escalationNotificationInterval) clearInterval(data.escalationNotificationInterval);
  }
  bot.stopPolling();
  await client.destroy();
  process.exit(0);
});
