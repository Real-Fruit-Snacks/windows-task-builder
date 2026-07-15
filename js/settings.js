/* Terminal Workbench tool — preference store (sole localStorage owner), settings
   panel, theme/accent switching, keyboard shortcuts and the help overlay. */

window.TW = window.TW || {};

(function () {
  "use strict";

  var mem = {};
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] !== undefined ? mem[k] : null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }

  function fire(key, val) {
    window.dispatchEvent(new CustomEvent("tw:prefs", { detail: { key: key, val: val } }));
    if (String(key).indexOf("task-pet") === 0) window.dispatchEvent(new Event("tw:pet"));
  }

  TW.prefs = {
    /* get(key, default, allowedValues?) — an out-of-range stored value falls
       back to the default rather than leaking into the UI */
    get: function (k, d, allowed) {
      var v = lsGet(k);
      if (v === null) return d === undefined ? null : d;
      if (allowed && allowed.indexOf(v) === -1) return d === undefined ? null : d;
      return v;
    },
    set: function (k, v) { lsSet(k, String(v)); fire(k, String(v)); },
    remove: function (k) { lsDel(k); fire(k, null); }
  };

  /* ---------- UI (only on index.html) ---------- */
  if (!document.getElementById("btn-settings")) return;

  var root = document.documentElement;

  function applyTheme(val) {
    if (val === "dark" || val === "light") root.setAttribute("data-theme", val);
    else root.removeAttribute("data-theme");
  }
  function applyAccent(val) {
    if (val && "12345".indexOf(val) > -1) root.setAttribute("data-accent", val);
    else root.removeAttribute("data-accent");
  }

  /* theme toggle button: explicit dark <-> light (system stays a settings choice) */
  document.getElementById("btn-theme").addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    var next;
    if (cur === "light") next = "dark";
    else if (cur === "dark") next = "light";
    else next = window.matchMedia("(prefers-color-scheme: light)").matches ? "dark" : "light";
    applyTheme(next);
    TW.prefs.set("task-theme", next);
    refreshSeg();
  });

  /* ---------- settings panel ---------- */
  var panel = document.getElementById("settings-panel");
  panel.hidden = false;

  function settingRow(label, controlHTML) {
    return '<div class="setting-row"><span class="manifest-label">' + label +
      "</span>" + controlHTML + "</div>";
  }

  panel.innerHTML =
    '<div class="panel-header"><span class="manifest-label">SETTINGS</span>' +
    '<button class="icon-btn" id="settings-close" aria-label="Close settings">&times;</button></div>' +
    '<div class="settings-body">' +
    settingRow("THEME", '<span class="seg" data-pref="task-theme">' +
      '<button data-val="dark">DARK</button><button data-val="light">LIGHT</button>' +
      '<button data-val="system">SYSTEM</button></span>') +
    settingRow("ACCENT", '<span class="seg accent-seg" data-pref="task-accent">' +
      '<button data-val="0" style="color:#63f2ab" aria-label="Mint accent">&#9632;</button>' +
      '<button data-val="1" style="color:#6bdcff" aria-label="Cyan accent">&#9632;</button>' +
      '<button data-val="2" style="color:#f0c674" aria-label="Amber accent">&#9632;</button>' +
      '<button data-val="3" style="color:#b78cff" aria-label="Violet accent">&#9632;</button>' +
      '<button data-val="4" style="color:#f7a35c" aria-label="Orange accent">&#9632;</button>' +
      '<button data-val="5" style="color:#ff6e7a" aria-label="Red accent">&#9632;</button></span>') +
    '<div id="pet-settings">' +
    '<div class="panel-header pet-header"><span class="manifest-label">PET</span></div>' +
    settingRow("MODE", '<span class="seg" data-petpref="task-pet">' +
      '<button data-val="float">FLOAT</button><button data-val="cursor">CURSOR</button>' +
      '<button data-val="off">OFF</button></span>') +
    settingRow("SIZE", '<input type="range" id="pet-size" min="16" max="64" step="2" aria-label="Pet size">') +
    settingRow("OPACITY", '<input type="range" id="pet-opacity" min="15" max="100" step="5" aria-label="Pet opacity">') +
    settingRow("NAP", petToggle("task-pet-nap")) +
    settingRow("FLEE", petToggle("task-pet-flee")) +
    settingRow("READ", petToggle("task-pet-read")) +
    settingRow("TRICKS", petToggle("task-pet-tricks")) +
    settingRow("SPEECH", petToggle("task-pet-speech")) +
    "</div></div>";

  function petToggle(key) {
    return '<span class="seg" data-petpref="' + key + '">' +
      '<button data-val="on">ON</button><button data-val="off">OFF</button></span>';
  }

  function petDefaults(key) {
    return { "task-pet": "float", "task-pet-nap": "on", "task-pet-flee": "on",
      "task-pet-read": "on", "task-pet-tricks": "on", "task-pet-speech": "off" }[key];
  }

  var scrim = document.getElementById("settings-scrim");

  function openSettings() {
    panel.classList.add("open");
    scrim.hidden = false;
    refreshSeg();
    refreshPet();
  }
  function closeSettings() {
    panel.classList.remove("open");
    scrim.hidden = true;
  }
  function settingsOpen() { return panel.classList.contains("open"); }

  function refreshSeg() {
    var segs = panel.querySelectorAll(".seg[data-pref]");
    for (var i = 0; i < segs.length; i++) {
      var key = segs[i].getAttribute("data-pref");
      var cur;
      if (key === "task-theme") cur = TW.prefs.get("task-theme", "system", ["dark", "light", "system"]);
      else cur = TW.prefs.get("task-accent", "0", ["1", "2", "3", "4", "5"]);
      var btns = segs[i].querySelectorAll("button");
      for (var j = 0; j < btns.length; j++)
        btns[j].classList.toggle("seg-active", btns[j].getAttribute("data-val") === cur);
    }
  }

  function refreshPet() {
    var segs = panel.querySelectorAll("[data-petpref]");
    for (var i = 0; i < segs.length; i++) {
      var key = segs[i].getAttribute("data-petpref");
      var cur = TW.prefs.get(key, petDefaults(key));
      var btns = segs[i].querySelectorAll("button");
      for (var j = 0; j < btns.length; j++)
        btns[j].classList.toggle("seg-active", btns[j].getAttribute("data-val") === cur);
    }
    document.getElementById("pet-size").value = TW.prefs.get("task-pet-size", "28");
    document.getElementById("pet-opacity").value = TW.prefs.get("task-pet-opacity", "70");
  }

  panel.addEventListener("click", function (e) {
    var b = e.target.closest(".seg button");
    if (!b) return;
    var seg = b.parentNode;
    var val = b.getAttribute("data-val");
    var key = seg.getAttribute("data-pref");
    if (key === "task-theme") {
      if (val === "system") { TW.prefs.remove("task-theme"); }
      else { TW.prefs.set("task-theme", val); }
      applyTheme(val === "system" ? null : val);
      refreshSeg();
      return;
    }
    if (key === "task-accent") {
      if (val === "0") { TW.prefs.remove("task-accent"); }
      else { TW.prefs.set("task-accent", val); }
      applyAccent(val === "0" ? null : val);
      refreshSeg();
      return;
    }
    key = seg.getAttribute("data-petpref");
    if (!key) return;
    TW.prefs.set(key, val);
    if (key === "task-pet") root.setAttribute("data-pet", val);
    refreshPet();
  });

  document.getElementById("pet-size").addEventListener("input", function () {
    TW.prefs.set("task-pet-size", this.value);
    root.style.setProperty("--pet-size", this.value + "px");
  });
  document.getElementById("pet-opacity").addEventListener("input", function () {
    TW.prefs.set("task-pet-opacity", this.value);
    root.style.setProperty("--pet-base-opacity", (this.value / 100).toFixed(3));
  });

  document.getElementById("btn-settings").addEventListener("click", function () {
    if (settingsOpen()) closeSettings(); else openSettings();
  });
  document.getElementById("settings-close").addEventListener("click", closeSettings);
  scrim.addEventListener("click", closeSettings);

  /* ---------- help overlay ---------- */
  var help = document.getElementById("help-overlay");
  help.innerHTML =
    '<div class="help-box panel">' +
    '<div class="panel-header"><span class="manifest-label">KEYBOARD</span>' +
    '<button class="icon-btn" id="help-close" aria-label="Close help">&times;</button></div>' +
    '<div class="help-body mono">' +
    '<div class="help-row"><span class="help-key">/</span><span>focus the input</span></div>' +
    '<div class="help-row"><span class="help-key">s</span><span>settings</span></div>' +
    '<div class="help-row"><span class="help-key">t</span><span>toggle theme</span></div>' +
    '<div class="help-row"><span class="help-key">?</span><span>this help</span></div>' +
    '<div class="help-row"><span class="help-key">esc</span><span>close / unfocus</span></div>' +
    "</div></div>";

  function openHelp() { help.hidden = false; }
  function closeHelp() { help.hidden = true; }
  document.getElementById("help-close").addEventListener("click", closeHelp);
  help.addEventListener("click", function (e) { if (e.target === help) closeHelp(); });

  /* ---------- keyboard shortcuts ---------- */
  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
    if (e.key === "Escape") {
      if (!help.hidden) { closeHelp(); return; }
      if (settingsOpen()) { closeSettings(); return; }
      if (typing) document.activeElement.blur();
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      var _f=document.querySelector('main textarea,main input:not([type=checkbox]):not([type=radio]):not([type=range])');if(_f)_f.focus();
    } else if (e.key === "s") {
      if (settingsOpen()) closeSettings(); else openSettings();
    } else if (e.key === "t") {
      document.getElementById("btn-theme").click();
    } else if (e.key === "?") {
      if (help.hidden) openHelp(); else closeHelp();
    }
  });
})();
