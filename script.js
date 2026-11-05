function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  const container = document.querySelector(".container");

  let chat = document.getElementById("lumenChat");

  if (!chat) {
    chat = document.createElement("div");
    chat.id = "lumenChat";
    chat.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: rgba(20, 30, 60, 0.5);
      border-radius: 12px;
      color: white;
      line-height: 1.6;
    `;
    container.appendChild(chat);
  }

  const userMessage = document.createElement("p");
  userMessage.textContent = "Você: " + message;
  chat.appendChild(userMessage);

  const reply = document.createElement("p");
  reply.textContent =
    "Lúmen: Recebi sua mensagem. Ainda estou aprendendo a conversar, mas estou aqui!";
  chat.appendChild(reply);

  input.value = "";
}

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("userInput");

  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });
  }
});
