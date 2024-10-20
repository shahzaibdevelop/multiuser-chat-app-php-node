let ws;
let currentRecipient;

function connect() {
  ws = new WebSocket('ws://localhost:3000');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'searchResult':
        displaySearchResult(data.result);
        break;
      case 'message':
        displayMessage(data.from, data.content);
        break;
    }
  };
}

function register() {
  const username = document.getElementById('username').value;
  if (username) {
    connect();
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', username }));
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('chat-container').style.display = 'block';
    };
  }
}

function searchUser() {
  const query = document.getElementById('search').value;
  ws.send(JSON.stringify({ type: 'search', query }));
}

function displaySearchResult(result) {
  const searchResult = document.getElementById('search-result');
  if (result) {
    searchResult.innerHTML = `<button onclick="startChat('${result}')">${result}</button>`;
  } else {
    searchResult.innerHTML = 'User not found';
  }
}

function startChat(username) {
  currentRecipient = username;
  document.getElementById('messages').innerHTML = '';
}

function sendMessage() {
  const messageInput = document.getElementById('message');
  const content = messageInput.value;
  if (content && currentRecipient) {
    ws.send(JSON.stringify({ type: 'message', to: currentRecipient, content }));
    displayMessage('You', content);
    messageInput.value = '';
  }
}

function displayMessage(from, content) {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML += `<p><strong>${from}:</strong> ${content}</p>`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
