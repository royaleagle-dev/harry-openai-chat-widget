function appendMessage(role, content) {
  const chatBox = document.getElementById("chatbox");
  const message = document.createElement("div");
  message.className = `msg ${role}`;
  message.textContent = content;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const inputElement = document.getElementById("input");
  const userMessage = inputElement?.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  inputElement.value = "";

  try {
    const response = await fetch("https://eoa21w4qk9rme7d.m.pipedream.net", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userMessage }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 API response:", data);
    const reply = data.response;
    if (reply) {
      appendMessage("assistant", reply);
    } else {
      throw new Error("❌ No valid reply received from assistant.");
    }

    /*
    const reply = data.reply || data.choices?.[0]?.message?.content;
    if (reply) {
      appendMessage("assistant", reply);
    } else {
      throw new Error("❌ No valid reply received from assistant.");
    }
    */
  } catch (error) {
    console.error("🚨 Fetch failed:", error.message);
    appendMessage("assistant", `❌ ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("input");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });

  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
