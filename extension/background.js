// ── Environment URLs ──────────────────────────────────────────
// Vagrant (lokal):   192.168.56.11 / 192.168.56.12
// Real VM (lokal):   192.168.1.11  / 192.168.1.12
// Production:        https://api.yourdomain.com / https://yourdomain.com

const API_URL      = "http://192.168.56.11/api/blacklist/";
const REDIRECT_URL = "http://192.168.56.12:3000/hold-on";

async function fetchAndSyncRules() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const domains = data.domains || [];

    // Membuat array aturan pemblokiran
    const newRules = domains.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: REDIRECT_URL }
      },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ["main_frame"]
      }
    }));

    // Mengambil ID aturan lama untuk dihapus
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    // Menerapkan aturan secara dinamis
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: newRules
    });

    console.log(`Successfully synced ${newRules.length} block rules.`);
  } catch (error) {
    console.error("Failed to sync blacklist rules:", error);
  }
}

// Sinkronisasi saat ekstensi dimuat/diinstal
chrome.runtime.onStartup.addListener(fetchAndSyncRules);
chrome.runtime.onInstalled.addListener(fetchAndSyncRules);

// Sinkronisasi secara berkala menggunakan Alarms API (setiap 60 menit)
chrome.alarms.create("syncBlacklist", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncBlacklist") {
    fetchAndSyncRules();
  }
});
