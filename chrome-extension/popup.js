// ============================
// popup.js — Chrome Extension
// Auto Script Kuesioner SIMA
// by muchrid
// ============================

const STORAGE_KEY = 'sima_installed';

// ---- Elements ----
const installScreen = document.getElementById('installScreen');
const mainScreen    = document.getElementById('mainScreen');
const installBtn    = document.getElementById('installBtn');
const runBtn        = document.getElementById('runBtn');
const copyBtn       = document.getElementById('copyBtn');
const copyIcon      = document.getElementById('copyIcon');
const statusMsg     = document.getElementById('statusMsg');
const statusDot     = document.getElementById('statusDot');
const tabBtns       = document.querySelectorAll('.tab-btn');
const tabContents   = document.querySelectorAll('.tab-content');

// ============================
// INIT — Check install state
// ============================
chrome.storage.local.get([STORAGE_KEY], (result) => {
  if (result[STORAGE_KEY]) {
    showMain();
  } else {
    showInstall();
  }
});

function showInstall() {
  installScreen.classList.add('active');
  mainScreen.classList.remove('active');
}

function showMain() {
  mainScreen.classList.add('active');
  installScreen.classList.remove('active');
}

// ============================
// INSTALL BUTTON
// ============================
installBtn.addEventListener('click', () => {
  // Animate button
  installBtn.textContent = '✅ Terpasang!';
  installBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

  setTimeout(() => {
    chrome.storage.local.set({ [STORAGE_KEY]: true }, () => {
      showMain();
    });
  }, 700);
});

// ============================
// TAB SWITCHING
// ============================
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${target}`).classList.add('active');
  });
});

// ============================
// RUN BUTTON — inject script
// ============================
runBtn.addEventListener('click', async () => {
  setStatus('info', '🔄 Menjalankan script...');
  setDot('running');
  runBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error('Tidak dapat menemukan tab aktif.');
    }

    // Inject the autofill script into the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectAutoScript,
    });

    if (results && results[0]) {
      const res = results[0].result;
      if (res && res.error) {
        throw new Error(res.error);
      }
      setStatus('success', '✅ Script berhasil dijalankan!');
      setDot('done');
    }
  } catch (err) {
    console.error('[AutoScript] Error:', err);
    const msg = err.message || 'Gagal menjalankan script.';
    setStatus('error', `❌ ${msg}`);
    setDot('error');
  } finally {
    runBtn.disabled = false;
    setTimeout(() => {
      setDot('idle');
    }, 4000);
  }
});

// ============================
// The actual autofill function
// injected into the target page
// ============================
function injectAutoScript() {
  try {
    // Confirmation popup styles & logic (same as original script)
    function showLoadingAnimation(c) {
      const l = document.createElement("div");
      l.innerHTML = `<style>.loading-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;justify-content:center;align-items:center;z-index:10001}.loading-content{display:flex;flex-direction:column;align-items:center;color:#fff;font-family:"Segoe UI",Arial,sans-serif}.spinner{width:50px;height:50px;border:4px solid rgba(255,255,255,0.2);border-top:4px solid #3a7bd5;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.loading-content p{font-size:16px;letter-spacing:0.5px;color:#e0e0e0}</style><div class="loading-overlay"><div class="loading-content"><div class="spinner"></div><p>Tunggu Sebentar...</p></div></div>`;
      document.body.appendChild(l);
      setTimeout(() => { document.body.removeChild(l); c(); }, 1500);
    }

    function showConfirmationPopup(c) {
      const p = document.createElement("div");
      p.innerHTML = `<style>.popup-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(44,62,80,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;animation:fadeIn 0.25s ease-out}.popup-content{background:linear-gradient(135deg,#2c3e50,#4a6582);padding:30px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.3);text-align:center;font-family:"Segoe UI",Arial,sans-serif;color:#fff;width:90%;max-width:450px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(5px)}.popup-content h2{margin:0 0 15px 0;font-size:24px;font-weight:600;color:#f5f5f5}.popup-content p{margin:0 0 25px 0;font-size:15px;line-height:1.5;color:#d1e0ad}.popup-buttons{display:flex;justify-content:center;gap:15px}.popup-buttons button{padding:12px 28px;border:none;border-radius:6px;cursor:pointer;font-size:15px;font-weight:600;transition:all 0.2s ease;min-width:100px}.popup-buttons .run-btn{background:linear-gradient(to right,#3498db,#2980b9);color:#fff;box-shadow:0 3px 10px rgba(52,152,219,0.3)}.popup-buttons .run-btn:hover{background:linear-gradient(to right,#2980ba,#2573a7);transform:translateY(-2px);box-shadow:0 5px 15px rgba(52,152,219,0.4);color:#fff}.popup-buttons .cancel-btn{background:linear-gradient(to right,#e74c3c,#c0392b);color:#fff;box-shadow:0 3px 10px rgba(231,76,60,0.3)}.popup-buttons .cancel-btn:hover{background:linear-gradient(to right,#c0392b,#b53225);transform:translateY(-2px);box-shadow:0 5px 15px rgba(231,76,60,0.4)}.credit{text-align:center;margin-top:15px;font-size:12px;color:#b0b0b0}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}</style><div class="popup-overlay"><div class="popup-content"><h2>Autofill Kuesioner</h2><p>Penilaian akan diisi secara acak (Sangat Tidak Puas, Tidak Puas, Cukup, Puas, atau Sangat Puas). Apakah Anda yakin menjalankan?</p><div class="popup-buttons"><button class="run-btn">Jalankan</button><button class="cancel-btn">Batal</button></div><div class="credit">Script by muchrid</div></div></div>`;
      document.body.appendChild(p);
      const r = p.querySelector('.run-btn'), b = p.querySelector('.cancel-btn');
      r.addEventListener('click', () => { document.body.removeChild(p); showLoadingAnimation(c); });
      b.addEventListener('click', () => { document.body.removeChild(p); console.log('Pengisian kuesioner dibatalkan.'); });
    }

    function fillRandomQuestionnaire() {
      let filled = 0, skipped = 0;

      // === Strategy 1: radio inside <ul> with name*="soal" ===
      document.querySelectorAll('ul').forEach(ul => {
        const inputs = Array.from(ul.querySelectorAll('input[type="radio"]'));
        if (!inputs.length) return;

        // Group by name so each question gets one answer
        const groups = {};
        inputs.forEach(r => {
          const key = r.name || '__noname__';
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
        });

        Object.values(groups).forEach(radios => {
          // Collect actual values present in THIS group (no hardcoding)
          const values = radios.map(r => r.value).filter(v => v && v.trim() !== '');
          if (!values.length) { skipped++; return; }
          const chosen = values[Math.floor(Math.random() * values.length)];
          radios.forEach(r => { if (r.value === chosen) r.checked = true; });
          filled++;
        });
      });

      // === Strategy 2: fallback — any radio with name*="soal" not inside ul ===
      if (filled === 0) {
        const allRadios = Array.from(document.querySelectorAll('input[type="radio"][name*="soal"]'));
        const groups = {};
        allRadios.forEach(r => {
          if (!groups[r.name]) groups[r.name] = [];
          groups[r.name].push(r);
        });
        Object.values(groups).forEach(radios => {
          const values = radios.map(r => r.value).filter(v => v && v.trim() !== '');
          if (!values.length) { skipped++; return; }
          const chosen = values[Math.floor(Math.random() * values.length)];
          radios.forEach(r => { if (r.value === chosen) r.checked = true; });
          filled++;
        });
      }

      // === Strategy 3: last resort — ALL radio groups on page ===
      if (filled === 0) {
        const allRadios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const groups = {};
        allRadios.forEach(r => {
          const key = r.name || r.getAttribute('name') || '__noname__';
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
        });
        Object.values(groups).forEach(radios => {
          const values = radios.map(r => r.value).filter(v => v && v.trim() !== '');
          if (!values.length) { skipped++; return; }
          const chosen = values[Math.floor(Math.random() * values.length)];
          radios.forEach(r => { if (r.value === chosen) r.checked = true; });
          filled++;
        });
      }

      console.log('[AutoScript] Selesai — ' + filled + ' soal terisi, ' + skipped + ' dilewati.');
      return { filled, skipped };
    }

    showConfirmationPopup(fillRandomQuestionnaire);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

// ============================
// COPY SCRIPT BUTTON
// ============================
copyBtn.addEventListener('click', () => {
  const scriptText = document.getElementById('scriptContent').textContent;
  navigator.clipboard.writeText(scriptText).then(() => {
    copyBtn.classList.add('copied');
    copyIcon.textContent = '✅';
    copyBtn.childNodes[1].textContent = ' Tersalin!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyIcon.textContent = '📋';
      copyBtn.childNodes[1].textContent = ' Salin Script';
    }, 2000);
  }).catch(() => {
    setStatus('error', '❌ Gagal menyalin. Coba manual.');
  });
});

// ============================
// HELPERS
// ============================
function setStatus(type, msg) {
  statusMsg.className = `status-msg ${type}`;
  statusMsg.textContent = msg;
}

function setDot(state) {
  statusDot.className = `status-dot ${state}`;
}
