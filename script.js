
const WORKER_URL = "https://lumen-bridge.andrebrazil.workers.dev";

const conversationHistory = [];

async function sendMessage() {
  const input = document.querySelector("input");
  const message = input.value.trim();

  if (!message) return;

  let chat = document.getElementById("lumen-chat");

  if (!chat) {
    chat = document.createElement("div");
    chat.id = "lumen-chat";
    chat.style.cssText = "padding:20px; margin-top:20px; color:white; font-size:20px; white-space:pre-wrap;";
    document.body.appendChild(chat);
  }

  chat.innerHTML += `<p><strong>Você:</strong> ${escapeHTML(message)}</p>`;
  input.value = "";

  const loading = document.createElement("p");
  loading.textContent = "Lúmen está pensando...";
  chat.appendChild(loading);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Erro na comunicação.");
    }

    const reply = data.reply;

    conversationHistory.push(
      { role: "user", text: message },
      { role: "model", text: reply }
    );

    loading.remove();

    const answer = document.createElement("p");
    answer.innerHTML = "<strong>Lúmen:</strong> " + escapeHTML(reply);
    chat.appendChild(answer);

  } catch (error) {
    loading.textContent = "Não consegui me conectar: " + error.message;
  }
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}
