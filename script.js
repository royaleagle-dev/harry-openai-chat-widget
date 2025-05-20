const input = document.getElementById("input");

function autoResize() {
  input.style.height = "auto"; // Reset the height
  input.style.height = `${input.scrollHeight}px`; // Set to full content height
}

// Auto-resize on input
input.addEventListener("input", autoResize);

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


const micBtn = document.getElementById("mic-btn");
const inputElement = document.getElementById("input");
micBtnInner = document.querySelector("#mic-btn-inner");

let recognition;
let isRecording = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalTranscript = "";

  recognition.onstart = () => {
    isRecording = true;
    finalTranscript = "";
    //micBtn.textContent = "⏹️";
    micBtnInner.className = "fas fa-stop";
    micBtn.title = "Stop recording";
    inputElement.placeholder = "Listening...";
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }
    inputElement.value = finalTranscript + interimTranscript;
    autoResize()
  };

  recognition.onend = () => {
    isRecording = false;
    //micBtn.textContent = "🎤";
    micBtnInner.className = "fas fa-microphone";
    micBtn.title = "Start recording";
    inputElement.placeholder = "Type or use the mic...";
    // Do NOT send automatically
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    recognition.stop();
  };
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech recognition not supported in this browser.";
}

micBtn.addEventListener("click", () => {
  if (!recognition) return;

  if (isRecording) {
    recognition.stop(); // Stop only — DO NOT call sendMessage()
  } else {
    recognition.start(); // Start recognition
  }
});






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

  if (role === "assistant") {
    // Convert markdown to HTML
    const html = marked.parse(content);
    message.innerHTML = html;
  } else {
    // Plain text for user
    message.textContent = content;
  }


  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const inputElement = document.getElementById("input");
  const userMessage = inputElement?.value.trim();
  if (!userMessage) return;

    // Stop recording if it's active
  if (isRecording && recognition) {
    recognition.stop();
    isRecording = false;
    //updateMicButton(); // optional: to update mic button UI
    micBtnInner.className = "fas fa-mic";
  }

  appendMessage("user", userMessage);
  inputElement.value = "";
  input.style.height = "auto"; //revert input to original height

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
