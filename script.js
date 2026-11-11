
const WORKER_URL = "https://lumen-bridge.andrebrazil.workers.dev";

const conversationHistory = [];

const orb = document.querySelector(".orb");
const statusText = document.querySelector(".status");

const animationStyle = document.createElement("style");

animationStyle.textContent = `
  .orb.is-thinking .eye {
    animation: lumen-think 1.2s ease-in-out infinite alternate;
  }

  .orb.is-speaking .mouth {
    animation: lumen-talk 0.22s ease-in-out infinite alternate;
    transform-origin: center;
  }

  @keyframes lumen-talk {
    0% {
      transform: scaleY(0.3) scaleX(0.9);
    }
    100% {
      transform: scaleY(3) scaleX(1.2);
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

function greet() {
  document.getElementById("userInput")?.focus();
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function typeReply(element, text) {
  setFaceState("speaking");

  for (const character of text) {
    element.textContent += character;
    await wait(55);
  }

  setFaceState("idle");
}

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
  const questionLabel = document.createElement("strong");

  questionLabel.textContent = "Você: ";
  question.appendChild(questionLabel);
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
    const answerLabel = document.createElement("strong");

    answerLabel.textContent = "Lúmen: ";
    answer.appendChild(answerLabel);

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

document.getElementById("userInput")?.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      sendMessage();
    }
  }
);

setFaceState("idle");

