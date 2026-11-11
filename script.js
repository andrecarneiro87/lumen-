const WORKER_URL = "https://lumen-bridge.andrebrazil.workers.dev";
const SESSION_KEY = "lumen_public_session_v1";
let sessionPromise = null;

const orb = document.querySelector(".orb");
const statusText = document.querySelector(".status");
const animationStyle = document.createElement("style");
animationStyle.textContent = `
.orb.is-thinking .eye{animation:lumen-think 1.2s ease-in-out infinite alternate}
.orb.is-speaking .mouth{animation:lumen-talk .22s ease-in-out infinite alternate;transform-origin:center}
@keyframes lumen-talk{0%{transform:scaleY(.3) scaleX(.9)}100%{transform:scaleY(3) scaleX(1.2)}}
@keyframes lumen-think{from{opacity:.65;transform:scale(.9)}to{opacity:1;transform:scale(1.12)}}`;
document.head.appendChild(animationStyle);

function setFaceState(state) {
  if (orb) {
    orb.classList.remove("is-thinking", "is-speaking");
    if (state) orb.classList.add("is-" + state);
  }
  if (statusText) statusText.textContent = ({ idle: "Olá. Estou despertando...", thinking: "Estou pensando...", speaking: "Estou conversando com você..." })[state] || "Olá. Estou despertando...";
}
function showReply(element, text) {
  setFaceState("speaking");
  element.style.whiteSpace = "pre-wrap";
  element.textContent = text;
  // A resposta já aparece inteira; a animação indica apenas a conclusão da fala.
  window.setTimeout(() => setFaceState("idle"), 450);
}

function responseError(data, fallback = "Erro na comunicação.") {
  if (!data || typeof data !== "object") return fallback;
  const value = data.details || data.detail || data.error || data.message;
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function getSession() {
  let token = null;
  try { token = localStorage.getItem(SESSION_KEY); } catch (_) {}
  if (token) return token;
  if (!sessionPromise) {
    sessionPromise = fetch(WORKER_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "session" })
    }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.token) throw new Error(responseError(data, "Não foi possível iniciar uma sessão segura."));
      try { localStorage.setItem(SESSION_KEY, data.token); } catch (_) {}
      return data.token;
    }).finally(() => { sessionPromise = null; });
  }
  return sessionPromise;
}

let sendingMessage = false;

async function sendMessage() {
  if (sendingMessage) return;
  const input = document.getElementById("userInput");
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;
  sendingMessage = true;

  let chat = document.getElementById("lumen-chat");
  if (!chat) {
    chat = document.createElement("div"); chat.id = "lumen-chat";
    chat.style.cssText = "padding:20px;margin-top:20px;color:white;font-size:20px;white-space:pre-wrap;";
    document.body.appendChild(chat);
  }
  const question = document.createElement("p");
  const questionLabel = document.createElement("strong");
  questionLabel.textContent = "Você: "; question.appendChild(questionLabel);
  question.appendChild(document.createTextNode(message)); chat.appendChild(question);
  input.value = "";
  const loading = document.createElement("p"); loading.textContent = "Lúmen está pensando..."; chat.appendChild(loading);
  setFaceState("thinking");

  try {
    let token = await getSession();
    let response = await fetch(WORKER_URL, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Session-Token": token },
      body: JSON.stringify({ message })
    });
    let data = await response.json();
    if (response.status === 401) {
      try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
      token = await getSession();
      response = await fetch(WORKER_URL, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Session-Token": token },
        body: JSON.stringify({ message })
      });
      data = await response.json();
    }
    if (!response.ok) throw new Error(responseError(data));
    loading.remove();
    const answer = document.createElement("p");
    const answerLabel = document.createElement("strong"); answerLabel.textContent = "Lúmen: "; answer.appendChild(answerLabel);
    const replyText = document.createElement("span"); answer.appendChild(replyText); chat.appendChild(answer);
    showReply(replyText, data.reply || "Não recebi uma resposta textual.");
  } catch (error) {
    loading.textContent = "Não consegui me conectar: " + error.message;
    setFaceState("idle");
  } finally {
    sendingMessage = false;
  }
}

document.getElementById("userInput")?.addEventListener("keydown", event => {
  if (event.key === "Enter") sendMessage();
});
setFaceState("idle");
