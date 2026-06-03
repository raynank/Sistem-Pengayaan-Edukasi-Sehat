// ── Environment URLs ──────────────────────────────────────────
// Backend API : http://192.168.56.11/api
// Frontend FE : http://192.168.56.12

const API_URL = "http://192.168.56.11/api/blacklist/";
const REDIRECT_URL = "http://192.168.56.12/hold-on";

async function fetchAndSyncRules() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const domains = data.domains || [];

    // Batas unsafe rules (redirect) di Chrome MV3 adalah 5.000.
    // Kita gunakan redirect hanya untuk 4.000 domain teratas agar diarahkan ke halaman hold-on.
    // Sisanya (sampai batas 25.000) akan menggunakan aksi 'block' (halaman default browser) yang dikategorikan 'safe' (limit 30.000).
    const REDIRECT_LIMIT = 4000;

    const newRules = domains.map((domain, index) => {
      const ruleId = index + 1;
      if (index < REDIRECT_LIMIT) {
        // Unsafe rule: redirect ke halaman hold-on
        return {
          id: ruleId,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { url: REDIRECT_URL }
          },
          condition: {
            urlFilter: `||${domain}^`,
            resourceTypes: ["main_frame"]
          }
        };
      } else {
        // Safe rule: block langsung (default browser block page)
        return {
          id: ruleId,
          priority: 1,
          action: {
            type: "block"
          },
          condition: {
            urlFilter: `||${domain}^`,
            resourceTypes: ["main_frame"]
          }
        };
      }
    });

    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: newRules
      });
      console.log(`Successfully synced ${newRules.length} block rules (${Math.min(newRules.length, REDIRECT_LIMIT)} redirect, ${Math.max(0, newRules.length - REDIRECT_LIMIT)} block).`);
    } catch (ruleError) {
      console.error("Error updating dynamic rules:", ruleError);
      
      // Fallback: Jika masih gagal, coba gunakan block saja untuk semua
      console.log("Mencoba fallback: Menggunakan aksi 'block' saja untuk semua rule...");
      const fallbackRules = domains.map((domain, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: ["main_frame"]
        }
      }));
      
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: fallbackRules.slice(0, 25000)
      });
      console.log("Fallback berhasil disinkronkan dengan aksi block saja.");
    }
    
  } catch (error) {
    console.error("Failed to sync blacklist rules:", error);
  }
}

chrome.runtime.onStartup.addListener(fetchAndSyncRules);
chrome.runtime.onInstalled.addListener(fetchAndSyncRules);

chrome.alarms.create("syncBlacklist", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncBlacklist") {
    fetchAndSyncRules();
  }
});