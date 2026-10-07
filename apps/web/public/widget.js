/*!
 * Bosun site-chat widget — zero dependencies, embedded via:
 *   <script src="https://app/widget.js" data-token="<connection-token>" async></script>
 * Optional attrs: data-api (override origin), data-position (left|right),
 * data-title (header label).
 */
(function () {
  "use strict";

  const script =
    document.currentScript ||
    document.querySelector("script[data-bosun-widget][data-token]") ||
    document.querySelector('script[data-token][src*="widget.js"]');
  if (!script) {
    console.error("[bosun-widget] script tag not found");
    return;
  }
  const TOKEN = script.getAttribute("data-token");
  const API = script.getAttribute("data-api") || script.src.replace(/\/widget\.js(\?.*)?$/, "");
  if (!TOKEN) {
    console.error("[bosun-widget] missing data-token");
    return;
  }

  const LS_KEY = "bosun_widget_" + TOKEN;
  const ACCENT = "#e86a17";

  const state = {
    sessionToken: null,
    lastId: null,
    source: null,
    sending: false,
    config: { welcomeText: "Olá! Como podemos ajudar?", accentColor: null, position: null },
  };

  try {
    state.sessionToken = window.localStorage.getItem(LS_KEY);
  } catch (_e) {
    /* storage blocked — session won't persist */
  }

  // ---------- styles ----------
  const style = document.createElement("style");
  style.textContent =
    ".bw-root{position:fixed;bottom:16px;z-index:99999;font-family:ui-sans-serif,system-ui,sans-serif}" +
    ".bw-right{right:16px}.bw-left{left:16px}" +
    ".bw-bubble{width:52px;height:52px;border:1px solid #333;background:var(--bw-accent," +
    ACCENT +
    ");color:#000;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px}" +
    ".bw-panel{display:none;position:absolute;bottom:64px;right:0;width:320px;max-width:calc(100vw - 32px);height:420px;background:#000;border:1px solid #333;flex-direction:column}" +
    ".bw-left .bw-panel{right:auto;left:0}" +
    ".bw-open .bw-panel{display:flex}" +
    ".bw-head{padding:10px 12px;border-bottom:1px solid #333;color:#fff;font-size:13px;font-weight:600;letter-spacing:.04em}" +
    ".bw-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}" +
    ".bw-msg{max-width:85%;padding:8px 10px;font-size:13px;line-height:1.4;white-space:pre-wrap;word-break:break-word}" +
    ".bw-in{align-self:flex-end;background:var(--bw-accent," +
    ACCENT +
    ");color:#000}" +
    ".bw-out{align-self:flex-start;background:#1a1a1a;color:#fff;border:1px solid #333}" +
    ".bw-sys{align-self:center;color:#888;font-size:12px;font-style:italic}" +
    ".bw-form,.bw-compose{border-top:1px solid #333;padding:10px;display:flex;flex-direction:column;gap:8px}" +
    ".bw-compose{flex-direction:row}" +
    ".bw-input{flex:1;background:#111;border:1px solid #333;color:#fff;padding:8px;font-size:13px}" +
    ".bw-input:focus{outline:1px solid var(--bw-accent," +
    ACCENT +
    ")}" +
    ".bw-btn{background:var(--bw-accent," +
    ACCENT +
    ");border:none;color:#000;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer}" +
    ".bw-btn:disabled{opacity:.5;cursor:default}" +
    ".bw-note{color:#888;font-size:11px}";
  document.head.appendChild(style);

  // ---------- dom ----------
  const root = document.createElement("div");
  root.className =
    "bw-root " + (script.getAttribute("data-position") === "left" ? "bw-left" : "bw-right");
  root.innerHTML =
    '<div class="bw-panel" role="dialog" aria-label="Chat de atendimento">' +
    '  <div class="bw-head">' +
    (script.getAttribute("data-title") || "Atendimento") +
    "  </div>" +
    '  <div class="bw-msgs"></div>' +
    '  <form class="bw-form" hidden>' +
    '    <input class="bw-input" name="name" placeholder="Seu nome" required maxlength="120">' +
    '    <input class="bw-input" name="email" type="email" placeholder="Seu e-mail" required>' +
    '    <input class="bw-input" name="phone" type="tel" placeholder="Telefone com DDD" required>' +
    '    <button class="bw-btn" type="submit">Iniciar conversa</button>' +
    '    <span class="bw-note" data-role="form-error"></span>' +
    "  </form>" +
    '  <form class="bw-compose" hidden>' +
    '    <input class="bw-input" name="text" placeholder="Escreva uma mensagem…" autocomplete="off" required>' +
    '    <button class="bw-btn" type="submit">Enviar</button>' +
    "  </form>" +
    "</div>" +
    '<button class="bw-bubble" type="button" aria-label="Abrir chat">✦</button>';
  document.body.appendChild(root);

  const msgsEl = root.querySelector(".bw-msgs");
  const formEl = root.querySelector(".bw-form");
  const composeEl = root.querySelector(".bw-compose");
  const formError = root.querySelector("[data-role=form-error]");
  const bubble = root.querySelector(".bw-bubble");

  bubble.addEventListener("click", function () {
    root.classList.toggle("bw-open");
    if (root.classList.contains("bw-open")) start();
  });

  function scrollBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addMsg(direction, text) {
    const el = document.createElement("div");
    el.className = "bw-msg bw-" + direction;
    el.textContent = text;
    msgsEl.appendChild(el);
    scrollBottom();
  }

  function addSys(text) {
    const el = document.createElement("div");
    el.className = "bw-sys";
    el.textContent = text;
    msgsEl.appendChild(el);
    scrollBottom();
  }

  function applyConfig(config) {
    if (config.accentColor) {
      root.style.setProperty("--bw-accent", config.accentColor);
    }
    if (config.welcomeText) state.config.welcomeText = config.welcomeText;
  }

  function post(url, body) {
    return fetch(API + url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().then(function (data) {
        return { status: r.status, data: data };
      });
    });
  }

  function fetchHistory() {
    let url = "/api/widget/messages?token=" + encodeURIComponent(state.sessionToken);
    if (state.lastId) url += "&after=" + encodeURIComponent(state.lastId);
    return fetch(API + url)
      .then(function (r) {
        return r.json();
      })
      .then(function (body) {
        if (!body.ok) return;
        body.messages.forEach(function (m) {
          addMsg(m.direction === "inbound" ? "in" : "out", m.text);
          state.lastId = m.id;
        });
      })
      .catch(function () {
        /* network hiccup — next ping retries */
      });
  }

  function openStream() {
    if (state.source || !state.sessionToken) return;
    const es = new EventSource(
      API + "/api/widget/stream?token=" + encodeURIComponent(state.sessionToken),
    );
    es.onmessage = function () {
      fetchHistory();
    };
    es.onerror = function () {
      /* browser auto-reconnects on the server-provided retry interval */
    };
    state.source = es;
  }

  function showChat() {
    formEl.hidden = true;
    composeEl.hidden = false;
    if (!msgsEl.children.length) addSys(state.config.welcomeText);
    fetchHistory().then(openStream);
  }

  function start() {
    if (state.sessionToken) {
      showChat();
    } else {
      composeEl.hidden = true;
      formEl.hidden = false;
      if (!msgsEl.children.length) addSys("Preencha seus dados para iniciar.");
    }
  }

  formEl.addEventListener("submit", function (ev) {
    ev.preventDefault();
    formError.textContent = "";
    const data = new FormData(formEl);
    const btn = formEl.querySelector("button");
    btn.disabled = true;
    post("/api/widget/session", {
      connectionToken: TOKEN,
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
    })
      .then(function (res) {
        btn.disabled = false;
        if (!res.data.ok) {
          formError.textContent =
            res.status === 404
              ? "Chat indisponível no momento."
              : "Confira seus dados e tente novamente.";
          return;
        }
        state.sessionToken = res.data.sessionToken;
        try {
          window.localStorage.setItem(LS_KEY, res.data.sessionToken);
        } catch (_e) {}
        applyConfig(res.data.config || {});
        msgsEl.innerHTML = "";
        showChat();
      })
      .catch(function () {
        btn.disabled = false;
        formError.textContent = "Falha de rede — tente novamente.";
      });
  });

  composeEl.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (state.sending || !state.sessionToken) return;
    const input = composeEl.querySelector("input[name=text]");
    const text = input.value.trim();
    if (!text) return;
    state.sending = true;
    input.value = "";
    post("/api/widget/message", {
      sessionToken: state.sessionToken,
      text: text,
      clientMessageId:
        window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    })
      .then(function (res) {
        state.sending = false;
        if (res.data && res.data.ok) {
          fetchHistory();
        } else if (res.status === 404) {
          addSys("Sessão expirada — recarregue a página.");
        } else {
          addSys("Não foi possível enviar. Tente de novo.");
        }
      })
      .catch(function () {
        state.sending = false;
        addSys("Falha de rede — mensagem não enviada.");
      });
    input.focus();
  });
})();
