
let userUUID = ''
let usersReadyStatus = []
let allUsers = []
let userNames = {};
let selectedColor = "#000"
let word = ''
let drawer = ''
let gameStatus = true
let guessWord = ''
let brushSize = 5

const roomId = JSON.parse(document.getElementById('room-id').textContent);
const gameSocket = new WebSocket(`ws://${window.location.host}/ws/game/${roomId}/`);

document.addEventListener("DOMContentLoaded", function(){
  userUUID = document.querySelector('.room-container-username').id;
});

const canvas = document.getElementById("game-canvas");


  const ctx = canvas.getContext("2d");
  let coord = { x: 0, y: 0 };
  let coordinates = []

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mouseup", stop);

  function resizeCanvas() {
  ctx.canvas.width = canvas.offsetWidth;
  ctx.canvas.height = canvas.offsetHeight;
  };

  function reposition(event) {
    coord.x = event.clientX - canvas.getBoundingClientRect().left;
    coord.y = event.clientY - canvas.getBoundingClientRect().top;
  }

  function start(event) {
    canvas.addEventListener("mousemove", draw);
    reposition(event);
  }

  function stop() {
    canvas.removeEventListener("mousemove", draw);
    if (coordinates.length != 0 && drawer == userUUID) {
      gameSocket.send(JSON.stringify({'type_send': 'coordinates', 'coordinates': coordinates, 'color': selectedColor, 'brushSize': brushSize}));
      coordinates = []
    }
  }

  function draw(event) {
    if (drawer == userUUID) {
      ctx.beginPath();
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.strokeStyle = selectedColor;
      ctx.moveTo(coord.x, coord.y);
      reposition(event);
      ctx.lineTo(coord.x, coord.y);
      ctx.stroke();
      
      coordinates.push({'x': coord.x, 'y': coord.y});
    }
  }


function changeColor(color) {
  selectedColor = color;
  bigContainerColor = document.getElementsByClassName('game-container-colors-color-big-container')[0];
  bigContainerColor.value = color;
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    .then(() => {
      // Получилось!
    })
    .catch(err => {
      console.log('Something went wrong', err);
    });
}

function goToHome() {
  window.location.href = "/";
};

function goToRoom() {
  window.location.href = window.location.href;
};

function readyButton() {
  // countPlayers = document.querySelector('.room-container-rooms-couter-first');
  // parentDiv = document.querySelector('#' + userUUID)
  // myStatus = parentDiv.querySelector(".room-container-rooms-user-status-false");
  
  // if (Number(countPlayers.innerHTML) != 1) {
  //   myStatus.className = 'room-container-rooms-user-status-true'
  //   myStatus.innerHTML = 'Ready'
  //   usersReadyStatus.push(userUUID)
  gameSocket.send(JSON.stringify({'type_send': 'ready', 'userUUID': userUUID}));
    
  //   if (usersReadyStatus.length == allUsers.length) {
  //     alert('все готовы')
  //   }
  // } else {
  //   alert("You can’t run the game alone!")
  // }
}

gameSocket.onmessage = function(e) {
  const data = JSON.parse(e.data);
  
  if (data.message_type == "text") {
    chatPlace = document.querySelector(".game-container-chat-chat");

    newMessage = document.createElement('div');
    newMessage.className = 'game-container-chat-chat-message'
    newMessage.innerHTML = data.username + ": " + data.message;

    chatPlace.appendChild(newMessage);
    chatPlace.scrollTop = chatPlace.scrollHeight;

    if (data.message.toLowerCase().includes(word.toLowerCase()) || data.message.toLowerCase() == word.toLowerCase()) {
      gameStatus = false;
      guessWord = data.username;
    }

  } else if (data.message_type == "coordinates" && userUUID != drawer) {
    let lastCoordinates = {'x': data.coordinates[0]['x'], 'y': data.coordinates[0]['y']};
    let delay = 10;

    function drawLine(i) {
      if (i < data.coordinates.length) {
        ctx.beginPath();
        ctx.lineWidth = data.brush_size;
        ctx.lineCap = "round";
        ctx.strokeStyle = data.color;
        ctx.moveTo(lastCoordinates['x'], lastCoordinates['y']);
        ctx.lineTo(data.coordinates[i]['x'], data.coordinates[i]['y']);
        ctx.stroke();
      
        lastCoordinates['x'] = data.coordinates[i]['x'];
        lastCoordinates['y'] = data.coordinates[i]['y'];
      
        setTimeout(function() {
          drawLine(i + 1);
        }, delay);
      }
    }
    drawLine(1);

  } else if (data.message_type == 'new_connect') {
    allUsers.push(data.uuid);
    roomCounter = document.querySelector('.room-container-rooms-couter-first');
    roomCounter.innerHTML = allUsers.length;

    var newDiv = document.createElement('div');
    newDiv.id = data.uuid;
    newDiv.className = 'room-container-rooms-user';
    var img = document.createElement('img');
    img.className = 'room-container-rooms-user-img';
    img.src = data.static_url_avatar;
    var userContainer = document.createElement('div');
    userContainer.className = 'room-container-rooms-user-container';
    var usernameDiv = document.createElement('div');
    usernameDiv.textContent = data.username;
    usernameDiv.className = 'room-container-rooms-user-username';
    var roomStatusDiv = document.createElement('div');
    roomStatusDiv.className = 'room-container-rooms-user-status-false';
    roomStatusDiv.textContent = 'Not ready';

    userContainer.appendChild(usernameDiv);
    userContainer.appendChild(roomStatusDiv);
    newDiv.appendChild(img);
    newDiv.appendChild(userContainer);

    var targetElement = document.querySelector('.room-container-rooms');
    targetElement.appendChild(newDiv);

  } else if (data.message_type == 'disconnect') {
    roomCounter = document.querySelector('.room-container-rooms-couter-first');
    roomCounter.innerHTML = Number(roomCounter.innerHTML) - 1;
    allUsers = allUsers.filter(item => item !== data.uuid);
    usersReadyStatus = usersReadyStatus.filter(item => item !== data.uuid);
    var parent = document.querySelector(".room-container-rooms");
    var leavedUser = document.getElementById(data.uuid);
    parent.removeChild(leavedUser);
  } else if (data.message_type == 'multi_connect') {
    if (data.for_user == userUUID) {
      for (var i = 0; i < data.usernames.length; ++i) {
        allUsers.push(data.uuids[i]);

        var newDiv = document.createElement('div');
        newDiv.id = data.uuids[i];
        newDiv.className = 'room-container-rooms-user';
        var img = document.createElement('img');
        img.className = 'room-container-rooms-user-img';
        img.src = data.static_url_avatars[i];
        var userContainer = document.createElement('div');
        userContainer.className = 'room-container-rooms-user-container';
        var usernameDiv = document.createElement('div');
        usernameDiv.textContent = data.usernames[i];
        usernameDiv.className = 'room-container-rooms-user-username';
        var roomStatusDiv = document.createElement('div');
        if (data.ready_status[i]) {
          roomStatusDiv.className = 'room-container-rooms-user-status-true';
          roomStatusDiv.textContent = 'Ready';
          usersReadyStatus.push(data.uuids[i])
        } else {
          roomStatusDiv.className = 'room-container-rooms-user-status-false';
          roomStatusDiv.textContent = 'Not ready';
        }

        userContainer.appendChild(usernameDiv);
        userContainer.appendChild(roomStatusDiv);
        newDiv.appendChild(img);
        newDiv.appendChild(userContainer);

        var targetElement = document.querySelector('.room-container-rooms');
        targetElement.appendChild(newDiv);
      };
      roomCounter = document.querySelector('.room-container-rooms-couter-first');
      roomCounter.innerHTML = allUsers.length;
    };
  } else if (data.message_type == 'ready') {
    countPlayers = document.querySelector('.room-container-rooms-couter-first');
    parentDiv = document.getElementById(data.userUUID)
    myStatus = parentDiv.querySelector(".room-container-rooms-user-status-false");
    
    if (Number(countPlayers.innerHTML) != 1) {
      myStatus.className = 'room-container-rooms-user-status-true'
      myStatus.innerHTML = 'Ready'
      usersReadyStatus.push(data.userUUID)
    } else {
      alert("You can’t run the game alone!")
    };

    if (allUsers.length == usersReadyStatus.length) {
      gameContainer = document.querySelector('.game-container');
      roomContainer = document.querySelector('.room-container')
      showTime = document.querySelector('.game-container-place-header-time')

      gameSocket.send(JSON.stringify({'type_send': 'unready', 'uuid': userUUID}));
      gameContainer.style.display = 'flex';
      roomContainer.style.display = 'none';
      showTime.style.display = 'block'
      usersReadyStatus = []
      resizeCanvas()
      
      allUsers.forEach(function(id) {
        var div = document.getElementById(id);
        if (div) {
          userNames[id] = div.textContent.replace("Ready", "");
        }
      });
      
      allUsers.sort(function(a, b) {
        var textA = userNames[a];
        var textB = userNames[b];
        return textA.localeCompare(textB);
      });
      prepareForGame();
    }
    } else if (data.message_type == 'save_word') {
        const byteArray = new Uint8Array(Object.values(data.word));
        const decoder = new TextDecoder('utf-8');
        word = decoder.decode(byteArray).toLowerCase();

        if (drawer != userUUID) {
          var inputMessage = document.querySelector('.game-container-chat-input-place');
          inputMessage.style.display = 'flex';
        }

        startGame();
    };
};

gameSocket.onclose = function(e) {
  console.error('Chat socket closed unexpectedly');
};

function prepareForGame() {
  drawer = allUsers[0];
  resizeCanvas();
  
  waitImg = document.querySelector('.wait-container');
  waitImg.style.display = 'block'

  cursorStyle = document.querySelector('#game-canvas');
  cursorStyle.style.cursor = 'default';

  var inputMessage = document.querySelector('.game-container-chat-input-place');
  inputMessage.style.display = 'none';

  closeColor = document.querySelector('.game-container-colors-container-close');
  closeColor.style.display = 'flex';

  placeHeader = document.querySelector('.game-container-place-header');
  placeHeader.innerHTML = userNames[drawer] + " draws"

  if (allUsers.length == 0) {
    gameTime = document.querySelector('.game-container-place-header-time');
    gameTime.style.display = 'none';

    waitImg = document.querySelector('.wait-container');
    waitImg.style.display = 'none'

    endContainer = document.querySelector('.end-container');
    roomContainer = document.querySelector('.game-container');

    endContainer.style.display = 'grid';
    roomContainer.style.display = 'none'
  }
  if (userUUID == drawer) {
    makeWordContainer = document.querySelector('.make-word');
    makeWordContainer.style.display = 'block';

    cursorStyle = document.querySelector('#game-canvas');
    cursorStyle.style.cursor = 'crosshair';

    closeColor = document.querySelector('.game-container-colors-container-close');
    closeColor.style.display = 'none';
  }
}

function startGame() {
  let count = 0;
  const totalCalls = 180;
  gameStatus = true;
  waitImg = document.querySelector('.wait-container');
  waitImg.style.display = 'none'

  const gameIntervalId = setInterval(function() {
    if (gameStatus == false) {
      count = totalCalls-1;
    }

    count++;

    gameTime = document.querySelector('.game-container-place-header-time');
    gameTime.innerHTML = totalCalls - count + 's.';

    if (count === totalCalls) {
      clearInterval(gameIntervalId);
      if (gameStatus == false) {
        winGame();
      } else {
        loseGame();
      }
    }
  }, 1000);
}

function loseGame() {
  const resultContent = document.querySelector('.win-result');
  resultContent.className = 'win-result win-result-red';
  resultContent.style.display = 'flex';

  wordTitle = document.querySelector('.win-result-title');
  wordUser = document.querySelector('.win-result-user');
  wordWord = document.querySelector('.win-result-word');
  wordTitle.innerHTML = 'The word was wrong';
  wordUser.innerHTML = '';
  wordWord.innerHTML = 'The word was - ' + word;

  gameTime = document.querySelector('.game-container-place-header-time');
  gameTime.innerHTML = '180s.';

  allUsers.shift();

  setTimeout(function() {
    resultContent.className = 'win-result';
    resultContent.style.display = 'none';
    prepareForGame();
  }, 7000);
}

function winGame() {
  confetti({spread: 360, particleCount: 200});
  const resultContent = document.querySelector('.win-result');
  resultContent.className = 'win-result win-result-green';
  resultContent.style.display = 'flex';

  wordTitle = document.querySelector('.win-result-title');
  wordUser = document.querySelector('.win-result-user');
  wordWord = document.querySelector('.win-result-word');

  wordTitle.innerHTML = 'Слово угадано!';
  wordUser.innerHTML = guessWord + " угадал слово!";
  wordWord.innerHTML = 'Слово было - ' + word;

  gameTime = document.querySelector('.game-container-place-header-time');
  gameTime.innerHTML = '180s.';

  allUsers.shift();

  setTimeout(function() {
    resultContent.className = 'win-result';
    resultContent.style.display = 'none';
    prepareForGame();
  }, 7000);

}


function saveWord() {
  getWord = document.querySelector('.make-word-input');

  if (getWord.value == '') {
    alert('Empty input!')
  } else {
    makeWordContainer = document.querySelector('.make-word');
    makeWordContainer.style.display = 'none';

    const encoder = new TextEncoder();
    const bytes = encoder.encode(getWord.value);
    gameSocket.send(JSON.stringify({'type_send': 'save_word', 'word': bytes}));

  }

}

function sendMessageChat() {
  inputText = document.querySelector('.game-container-chat-input');

  if (inputText.value != "" && inputText.value.length <= 26) {
    parantDiv = document.querySelector('.room-container-userstart');
    username = document.querySelector('.room-container-username').innerHTML;
    gameSocket.send(JSON.stringify({'type_send': 'text', 'message': inputText.value, 'username': username}));
    inputText.value = '';
  }

}

document.querySelector('.game-container-chat-input').focus();
document.querySelector('.game-container-chat-input').onkeyup = function(e) {
    if (e.key === 'Enter') {
        sendMessageChat();
    }
};

function changeBrushSize() {
  inputBrushSize = document.querySelector('.game-container-color-range').value;
  brushSize = inputBrushSize;
}