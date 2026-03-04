const BF = {
  storage: {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    del(key) {
      localStorage.removeItem(key);
    }
  }
};

const BF_KEYS = { session: "bf_session", data: "bf_data" };

function bfInitDemoData() {
  const existing = BF.storage.get(BF_KEYS.data, null);
  if (existing) return;

  BF.storage.set(BF_KEYS.data, {
    currency: "RD$",
    account: { numberMask: "**** 1842", balance: 32500.75 },
    moves: [
      { type: "Ingreso", desc: "Depósito (demo)", amount: 12000, date: "2026-03-01", ref: "BF-DEP-0301" },
      { type: "Pago", desc: "Servicio de internet (demo)", amount: -1650, date: "2026-02-26", ref: "BF-PAG-0226" },
      { type: "Compra", desc: "Supermercado (demo)", amount: -2430.5, date: "2026-02-24", ref: "BF-COM-0224" }
    ]
  });
}

function bfTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function bfRef(prefix="BF") {
  const part = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${part}`;
}
function bfRequireAuth() {
  const s = BF.storage.get(BF_KEYS.session, null);
  if (!s || !s.loggedIn) {
    if (location.pathname.includes("/app/")) location.href = "../auth/login.html";
  }
}
function bfMoney(amount) {
  const data = BF.storage.get(BF_KEYS.data, { currency: "RD$" });
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${data.currency} ${abs.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function bfAddMove(move) {
  const data = BF.storage.get(BF_KEYS.data, null);
  if (!data) return;
  data.moves.unshift(move);
  data.account.balance = Number((data.account.balance + move.amount).toFixed(2));
  BF.storage.set(BF_KEYS.data, data);
}

function bfRenderLogin() {
  const form = document.getElementById("loginForm");
  const fill = document.getElementById("fillDemo");
  if (!form) return;

  bfInitDemoData();

  fill?.addEventListener("click", () => {
    document.getElementById("user").value = "paula";
    document.getElementById("pin").value = "1234";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("user").value.trim();
    const pin = document.getElementById("pin").value.trim();
    if (pin !== "1234") return alert("PIN inválido (demo). Prueba 1234.");
    BF.storage.set(BF_KEYS.session, { loggedIn: true, username, at: new Date().toISOString() });
    location.href = "../app/dashboard.html";
  });
}
function bfLogoutBind() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    BF.storage.del(BF_KEYS.session);
    location.href = "../auth/login.html";
  });
}
function bfRenderDashboard() {
  const balanceText = document.getElementById("balanceText");
  const movesList = document.getElementById("movesList");
  const lastMoveText = document.getElementById("lastMoveText");
  const welcomeText = document.getElementById("welcomeText");
  const acctMask = document.getElementById("acctMask");
  if (!balanceText || !movesList) return;

  bfInitDemoData();
  const data = BF.storage.get(BF_KEYS.data, null);
  const session = BF.storage.get(BF_KEYS.session, { username: "cliente" });

  welcomeText.textContent = `Hola, ${session.username}. Panel demo (no real).`;
  balanceText.textContent = bfMoney(data.account.balance);
  if (acctMask) acctMask.textContent = data.account.numberMask;

  const last = data.moves[0];
  lastMoveText.textContent = last ? `${last.date} — ${last.desc}: ${bfMoney(last.amount)}` : "Sin movimientos";

  movesList.innerHTML = "";
  data.moves.slice(0, 8).forEach((m) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.gap = "12px";
    row.style.border = "1px solid rgba(255,255,255,.10)";
    row.style.borderRadius = "14px";
    row.style.padding = "10px 12px";
    row.style.background = "rgba(255,255,255,.03)";
    row.innerHTML = `<span>${m.date} • ${m.type} • ${m.desc}<br><small class="muted">Ref: ${m.ref}</small></span><strong>${bfMoney(m.amount)}</strong>`;
    movesList.appendChild(row);
  });
}

function bfBindTransferencias() {
  const form = document.getElementById("transferForm");
  const out = document.getElementById("transferReceipt");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const toName = document.getElementById("toName").value.trim();
    const toBank = document.getElementById("toBank").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const concept = document.getElementById("concept").value.trim() || "Transferencia (demo)";
    if (!toName || !toBank || !Number.isFinite(amount) || amount <= 0) return alert("Completa los datos correctamente.");

    const ref = bfRef("BF-TRF");
    const move = { type: "Transferencia", desc: `${concept} a ${toName} (${toBank})`, amount: -amount, date: bfTodayISO(), ref };
    bfAddMove(move);

    out.innerHTML = `
      <div class="hr"></div>
      <span class="badge">Comprobante (demo)</span>
      <h3 style="margin:10px 0 6px;">Transferencia realizada</h3>
      <p class="muted" style="margin:0 0 10px;">Ref: <strong>${ref}</strong></p>
      <ul class="muted" style="margin:0; padding-left:18px;">
        <li>Beneficiario: ${toName}</li>
        <li>Banco destino: ${toBank}</li>
        <li>Monto: <strong>${bfMoney(amount)}</strong></li>
        <li>Concepto: ${concept}</li>
        <li>Fecha: ${move.date}</li>
      </ul>
    `;
    form.reset();
  });
}

function bfBindPagos() {
  const form = document.getElementById("payForm");
  const out = document.getElementById("payReceipt");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const service = document.getElementById("service").value.trim();
    const contract = document.getElementById("contract").value.trim();
    const amount = Number(document.getElementById("payAmount").value);
    if (!service || !contract || !Number.isFinite(amount) || amount <= 0) return alert("Completa los datos correctamente.");

    const ref = bfRef("BF-PAG");
    const move = { type: "Pago", desc: `${service} (Contrato ${contract})`, amount: -amount, date: bfTodayISO(), ref };
    bfAddMove(move);

    out.innerHTML = `
      <div class="hr"></div>
      <span class="badge">Comprobante (demo)</span>
      <h3 style="margin:10px 0 6px;">Pago registrado</h3>
      <p class="muted" style="margin:0 0 10px;">Ref: <strong>${ref}</strong></p>
      <ul class="muted" style="margin:0; padding-left:18px;">
        <li>Servicio: ${service}</li>
        <li>Contrato/Referencia: ${contract}</li>
        <li>Monto: <strong>${bfMoney(amount)}</strong></li>
        <li>Fecha: ${move.date}</li>
      </ul>
    `;
    form.reset();
  });
}

function bfBindPrestamoCalc() {
  const form = document.getElementById("loanForm");
  const out = document.getElementById("loanOut");
  if (!form) return;

  function payment(P, annualRate, months) {
    const r = (annualRate / 100) / 12;
    if (r === 0) return P / months;
    return (P * r) / (1 - Math.pow(1 + r, -months));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById("loanAmount").value);
    const months = Number(document.getElementById("loanMonths").value);
    const rate = Number(document.getElementById("loanRate").value);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(months) || months <= 0 || !Number.isFinite(rate) || rate < 0) {
      return alert("Verifica monto, plazo y tasa.");
    }
    const cuota = payment(amount, rate, months);
    const total = cuota * months;
    out.innerHTML = `
      <div class="hr"></div>
      <span class="badge">Resultado (demo)</span>
      <p class="muted" style="margin:10px 0 0;">
        Monto: <strong>${bfMoney(amount)}</strong><br>
        Plazo: <strong>${months}</strong> meses<br>
        Tasa anual: <strong>${rate}%</strong><br>
        Cuota estimada: <strong>${bfMoney(cuota)}</strong><br>
        Total estimado: <strong>${bfMoney(total)}</strong>
      </p>
      <p class="muted" style="margin:10px 0 0;">Nota: cálculo aproximado para fines educativos.</p>
    `;
  });
}

/* Boot */
(function () {
  if (location.pathname.includes("/app/")) bfRequireAuth();
  bfInitDemoData();
  bfRenderLogin();
  bfLogoutBind();
  bfRenderDashboard();
  bfBindTransferencias();
  bfBindPagos();
  bfBindPrestamoCalc();
})();