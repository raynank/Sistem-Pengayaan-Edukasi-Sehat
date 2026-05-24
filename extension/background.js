// Production URLs — sesuaikan dengan domain aktual saat deploy
const API_URL = "https://api.yourdomain.com/api/blacklist/";
const REDIRECT_URL = "https://yourdomain.com/hold-on";

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
