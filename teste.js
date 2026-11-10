
const WORKER_URL = "https://lumen-bridge-teste.andrebrazil.workers.dev";

const conversationHistory = [];

function greet() {
  const status = document.getElementById("status");
  const message = document.getElementById("message");

  status.textContent = "Estou aqui. Pronto para conversar!";
  message.textContent = "Olá! Que bom ter você comigo. Por onde começamos?";
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  let chat = document.getElementById("lumen-chat");

  if (!chat) {
    chat = document.createElement("div");
    chat.id = "lumen-chat";
    chat.style.cssText =
      "width:100%;max-width:600px;padding:20px;margin-top:20px;color:white;font-size:18px;white-space:pre-wrap;text-align:left;";
    document.querySelector(".container").appendChild(chat);
  }

  const userMessage = document.createElement("p");
  userMessage.innerHTML = "<strong>Você:</strong> " + escapeHTML(message);
  chat.appendChild(userMessage);

  input.value = "";
  input.disabled = true;

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
      throw new Error(
        data.details || data.error || "Erro na comunicação."
      );
    }

    const reply = data.reply;

    if (!reply) {
      throw new Error("O Worker não retornou uma resposta válida.");
    }

    conversationHistory.push(
      { role: "user", text: message },
      { role: "model", text: reply }
    );

    loading.remove();

    const answer = document.createElement("p");
    answer.innerHTML =
      "<strong>Lúmen:</strong> " + escapeHTML(reply);

    chat.appendChild(answer);

    // Identificação do provedor e do modelo
    const modelInfo = document.createElement("p");
    modelInfo.style.cssText =
      "font-size:13px;color:#9cc9ed;margin-top:5px;";

    const provider = data.provider || "Não informado";
    const model = data.model || "Não informado";

    modelInfo.textContent =
      "Motor: " + provider + " | Modelo: " + model;

    chat.appendChild(modelInfo);

    document.getElementById("status").textContent =
      "Estou conversando com você.";

  } catch (error) {
    loading.textContent =
      "Não consegui me conectar: " + error.message;

  } finally {
    input.disabled = false;
    input.focus();
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

document.getElementById("userInput").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    sendMessage();
  }
});
