//start a new session on refresh;
localStorage.removeItem("threadId");


const baseId = 'appGfBRcScvTjKDqF';
const tableName = 'tblaybpqLFecXqopC';
const token = 'patCkcfnJCgZJSp8H.0c8c9a921e6393935d4c905a752e8dd0270191459e192e911b81529699e23351';

//OPENAI Thread ID
let threadId = localStorage.getItem("threadId") || null;


const createRecord = async (fields) => {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  const data = await response.json();
  console.log('Created:', data);
};


const fetchData = async () => {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
};

fetchData();


let recognition;

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log("🎙️ Listening...");
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("📝 Transcript:", transcript);
    document.getElementById("input").value = transcript;
    sendMessage(); // Reuse your existing function
  };

  recognition.start();
}



let typingMessageEl = null;

function showTyping() {
  const chatBox = document.getElementById("chatbox");
  typingMessageEl = document.createElement("div");
  typingMessageEl.className = "msg assistant typing";
  typingMessageEl.textContent = "Typing...";
  chatBox.appendChild(typingMessageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  if (typingMessageEl) {
    typingMessageEl.remove();
    typingMessageEl = null;
  }
}




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

  showTyping();

  try {
    const response = await fetch("https://eoa21w4qk9rme7d.m.pipedream.net", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        userMessage, 
        threadId: threadId || undefined // Only send if it exists 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 API response:", data);

    // ✅ Save threadId for future use
    if (data.threadId) {
      threadId = data.threadId;
      console.log(threadId);
      localStorage.setItem("threadId", threadId);

      //save record to airtable
      createRecord({
          thread_id: threadId,
          message: userMessage,
          message_type: 'user'
      });
    }

    removeTyping();


    const reply = data.response;
    if (reply) {
      appendMessage("assistant", reply);
      //save record to airtable
      createRecord({
          thread_id: threadId,
          message: reply,
          message_type: 'assistant'
      });
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
