
const WORKER_URL = "https://lumen-bridge.andrebrazil.workers.dev";

const conversationHistory = [];

// Elementos do rosto e da interface
const orb = document.querySelector(".orb");
const mouth = document.querySelector(".mouth");
const statusText = document.querySelector(".status");

// Animações do Lúmen
const animationStyle = document.createElement("style");

animationStyle.textContent = `
  .orb.is-thinking .eye {
    animation: lumen-think 1.2s ease-in-out infinite alternate;
  }

  .orb.is-speaking .mouth {
    animation: lumen-talk 0.18s ease-in-out infinite alternate;
    transform-origin: center;
  }

  @keyframes lumen-talk {
    0% {
      transform: scaleY(0.5) scaleX(1);
    }
    100% {
      transform: scaleY(2.2) scaleX(1.15);
    }
  }

  @keyframes lumen-think {
    from {
      opacity: 0.65;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1.12);
    }
  }
`;

document.head.appendChild(animationStyle);

function setFaceState(state) {
  if (!orb) return;

  orb.classList.remove("is-thinking", "is-speaking");

  if (state) {
    orb.classList.add("is-" + state);
  }

  if (statusText) {
    const messages = {
      idle: "Olá. Estou despertando...",
      thinking: "Estou pensando...",
      speaking: "Estou conversando com você..."
    };

    statusText.textContent = messages[state] || messages.idle;
  }
}

// Botão inicial
function greet() {
  document.getElementById("userInput")?.focus();
}

// Apresenta a resposta gradualmente
async function typeReply(element, text) {
  setFaceState("speaking");

  let displayedText = "";

  for (const character of text) {
    displayedText += character;
    element.textContent = displayedText;

    await new Promise(resolve => setTimeout(resolve, 18));
  }

  setFaceState("idle");
}

// Comunicação com Lúmen
async function sendMessage() {
  const input = document.getElementById("userInput");

  if (!input) return;

  const message = input.value.trim();

  if (!message) return;

  let chat = document.getElementById("lumen-chat");

  if (!chat) {
    chat = document.createElement("div");
    chat.id = "lumen-chat";
    chat.style.cssText =
      "padding:20px; margin-top:20px; color:white; font-size:20px; white-space:pre-wrap;";
    document.body.appendChild(chat);
  }

  const question = document.createElement("p");
  question.innerHTML = "<strong>Você:</strong> ";
  question.appendChild(document.createTextNode(message));
  chat.appendChild(question);

  input.value = "";

  const loading = document.createElement("p");
  loading.textContent = "Lúmen está pensando...";
  chat.appendChild(loading);

  setFaceState("thinking");

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

    conversationHistory.push(
      { role: "user", text: message },
      { role: "model", text: reply }
    );

    loading.remove();

    const answer = document.createElement("p");
    const label = document.createElement("strong");

    label.textContent = "Lúmen: ";
    answer.appendChild(label);

    const replyText = document.createElement("span");
    answer.appendChild(replyText);

    chat.appendChild(answer);

    await typeReply(replyText, reply);

  } catch (error) {
    loading.textContent =
      "Não consegui me conectar: " + error.message;

    setFaceState("idle");
  }
}

// Permite enviar a mensagem com Enter
document.getElementById("userInput")?.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      sendMessage();
    }
  }
);

setFaceState("idle");
