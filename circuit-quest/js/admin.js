// Admin panel: CRUD + reordering for levels, backed by LevelStore
// (localStorage). No server — this is exactly the "local storage /
// database for persisting levels created via the admin panel" from the
// spec. Export/Import JSON lets you move content between browsers or keep
// it in version control.

const PASSPHRASE = "circuits"; // client-side gate only, see admin.html note.

const CONFIG_SCHEMAS = {
  "ohms-law": [
    { key: "unknown", label: "Solve for", type: "select", options: ["V", "I", "R"] },
    { key: "V", label: "Voltage V (blank if unknown)", type: "number" },
    { key: "I", label: "Current I (blank if unknown)", type: "number" },
    { key: "R", label: "Resistance R (blank if unknown)", type: "number" },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "series-circuit": [
    { key: "V", label: "Source Voltage", type: "number" },
    { key: "resistors", label: "Resistor values (comma-separated)", type: "list" },
    { key: "find", label: "Find", type: "select", options: ["totalR", "totalI"] },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "parallel-circuit": [
    { key: "V", label: "Source Voltage", type: "number" },
    { key: "resistors", label: "Resistor values (comma-separated)", type: "list" },
    { key: "find", label: "Find", type: "select", options: ["totalR", "totalI"] },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "kirchhoff-current": [
    { key: "into", label: "Currents into node (comma-separated, use 'null' for the unknown)", type: "list-null" },
    { key: "outOf", label: "Currents out of node (comma-separated, use 'null' for the unknown)", type: "list-null" },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "rc-time-constant": [
    { key: "R", label: "Resistance (Ω)", type: "number" },
    { key: "C", label: "Capacitance (µF)", type: "number" },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "ac-power": [
    { key: "V", label: "Voltage V (rms)", type: "number" },
    { key: "I", label: "Current I (rms)", type: "number" },
    { key: "angleDeg", label: "Angle θ (degrees, current lags voltage)", type: "number" },
    { key: "find", label: "Find", type: "select", options: ["P", "Q", "S", "pf"] },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "three-phase": [
    { key: "system", label: "System", type: "select", options: ["wye", "delta"] },
    { key: "V_phase", label: "Phase Voltage", type: "number" },
    { key: "I_phase", label: "Phase Current", type: "number" },
    { key: "cosPhi", label: "Power factor (cos φ)", type: "number" },
    { key: "find", label: "Find", type: "select", options: ["V_line", "I_line", "P_total"] },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
  "laplace-transform": [
    { key: "kind", label: "Function", type: "select", options: ["step", "ramp", "exp"] },
    { key: "a", label: "Decay rate a (exponential only)", type: "number" },
    { key: "s", label: "Evaluate at s =", type: "number" },
    { key: "min", label: "Slider min", type: "number" },
    { key: "max", label: "Slider max", type: "number" },
    { key: "step", label: "Slider step", type: "number" },
  ],
};

let editingId = null;

function checkGate() {
  const stored = sessionStorage.getItem("ee-admin-ok");
  if (stored === "1") {
    document.getElementById("gate").style.display = "none";
    document.getElementById("app").style.display = "block";
    renderList();
  }
}

document.getElementById("enter-btn").addEventListener("click", () => {
  const val = document.getElementById("passphrase").value;
  if (val === PASSPHRASE) {
    sessionStorage.setItem("ee-admin-ok", "1");
    checkGate();
  } else {
    document.getElementById("gate-error").textContent = "Wrong passphrase.";
  }
});

function renderList() {
  const levels = LevelStore.getAll();
  const list = document.getElementById("level-list");
  list.innerHTML = "";
  levels.forEach((lvl, i) => {
    const row = document.createElement("div");
    row.className = "level-row";
    row.innerHTML = `
      <div class="info">
        <span class="badge">${i + 1}</span>
        <strong>${lvl.title}</strong>
        <span class="dim">— ${lvl.topic} (${lvl.puzzleType})</span>
      </div>
      <div class="actions">
        <button data-act="up" ${i === 0 ? "disabled" : ""}>↑</button>
        <button data-act="down" ${i === levels.length - 1 ? "disabled" : ""}>↓</button>
        <button data-act="edit">Edit</button>
        <button data-act="delete" class="danger">Delete</button>
      </div>
    `;
    row.querySelector('[data-act="up"]').onclick = () => { LevelStore.move(lvl.id, -1); renderList(); };
    row.querySelector('[data-act="down"]').onclick = () => { LevelStore.move(lvl.id, 1); renderList(); };
    row.querySelector('[data-act="edit"]').onclick = () => openEditor(lvl);
    row.querySelector('[data-act="delete"]').onclick = () => {
      pixelConfirm(`Delete "${lvl.title}"?`, () => { LevelStore.remove(lvl.id); renderList(); });
    };
    list.appendChild(row);
  });
}

function renderConfigFields(type, config) {
  const container = document.getElementById("config-fields");
  container.innerHTML = "";
  (CONFIG_SCHEMAS[type] || []).forEach((f) => {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const label = document.createElement("label");
    label.textContent = f.label;
    wrap.appendChild(label);

    let input;
    const raw = config[f.key];
    if (f.type === "select") {
      input = document.createElement("select");
      f.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (raw === opt) o.selected = true;
        input.appendChild(o);
      });
    } else {
      input = document.createElement("input");
      input.type = f.type === "number" ? "number" : "text";
      if (f.type === "list" && Array.isArray(raw)) input.value = raw.join(", ");
      else if (f.type === "list-null" && Array.isArray(raw)) input.value = raw.map((v) => (v === null ? "null" : v)).join(", ");
      else if (raw !== undefined && raw !== null) input.value = raw;
    }
    input.dataset.key = f.key;
    input.dataset.fieldType = f.type;
    input.id = "cfg-" + f.key;
    wrap.appendChild(input);
    container.appendChild(wrap);
  });
}

function readConfigFields(type) {
  const config = {};
  (CONFIG_SCHEMAS[type] || []).forEach((f) => {
    const el = document.getElementById("cfg-" + f.key);
    const val = el.value.trim();
    if (f.type === "number") {
      config[f.key] = val === "" ? undefined : parseFloat(val);
    } else if (f.type === "list") {
      config[f.key] = val.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    } else if (f.type === "list-null") {
      config[f.key] = val.split(",").map((s) => {
        s = s.trim();
        return s.toLowerCase() === "null" || s === "" ? null : parseFloat(s);
      });
    } else {
      config[f.key] = val;
    }
  });
  return config;
}

function openEditor(lvl) {
  editingId = lvl ? lvl.id : null;
  document.getElementById("editor").style.display = "block";
  document.getElementById("editor-title").textContent = lvl ? "Edit Level" : "New Level";
  document.getElementById("f-topic").value = lvl?.topic || "";
  document.getElementById("f-title").value = lvl?.title || "";
  document.getElementById("f-concept").value = lvl?.concept || "";
  document.getElementById("f-type").value = lvl?.puzzleType || "ohms-law";
  document.getElementById("f-tolerance").value = lvl?.tolerance ?? 0.05;
  document.getElementById("f-hint").value = lvl?.hint || "";
  renderConfigFields(document.getElementById("f-type").value, lvl?.config || {});
  document.getElementById("editor").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("f-type").addEventListener("change", (e) => {
  renderConfigFields(e.target.value, {});
});

document.getElementById("add-btn").addEventListener("click", () => openEditor(null));
document.getElementById("cancel-btn").addEventListener("click", () => {
  document.getElementById("editor").style.display = "none";
});

document.getElementById("save-btn").addEventListener("click", () => {
  const type = document.getElementById("f-type").value;
  const level = {
    id: editingId || LevelStore.newId(),
    topic: document.getElementById("f-topic").value || "Untitled Topic",
    title: document.getElementById("f-title").value || "Untitled Level",
    concept: document.getElementById("f-concept").value,
    puzzleType: type,
    config: readConfigFields(type),
    tolerance: parseFloat(document.getElementById("f-tolerance").value) || 0.05,
    hint: document.getElementById("f-hint").value,
  };
  LevelStore.upsert(level);
  document.getElementById("editor").style.display = "none";
  renderList();
});

document.getElementById("export-btn").addEventListener("click", () => {
  pixelTextDialog("Export Levels JSON", LevelStore.exportJSON());
});

document.getElementById("import-btn").addEventListener("click", () => {
  document.getElementById("import-file").click();
});
document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      LevelStore.importJSON(reader.result);
      renderList();
      pixelNotice("Levels imported.");
    } catch (err) {
      pixelNotice("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
});

document.getElementById("reset-btn").addEventListener("click", () => {
  pixelConfirm("Reset all levels to the bundled defaults? This discards any custom levels.", () => {
    LevelStore.resetToDefaults();
    renderList();
  });
});

checkGate();
