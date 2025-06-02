function changeAvatar() {
    imgElement = document.querySelector('.main-container-avatar-img');
    imgElement.src = avatarURLs[Math.floor(Math.random() * avatarURLs.length)];

    showSaveButton();
  }

function createRoom() {
    username = document.getElementsByClassName("main-container-username-input")[0].value;
    imgElement = document.querySelector('.main-container-avatar-img').src.split('/');
    if (username == '') {
      return alert('Username is empty!')
    }
    const roomId = JSON.parse(document.getElementById('room-id').textContent);
    if (roomId == null) {
      window.location.href = decodeURIComponent('/get_user_data/' + username + '/' + imgElement[imgElement.length - 1]);
    } else {
      window.location.href = decodeURIComponent('/get_user_data/' + username + '/' + imgElement[imgElement.length - 1] + '?room_id='+ roomId);
    }
}

function saveData() {

  username = document.getElementsByClassName("main-container-username-input")[0].value;
  imgElement = document.querySelector('.main-container-avatar-img').src.split('/');
  if (username == '') {
    return alert('Username is empty!')
  }

  saveDataUrl = decodeURIComponent('/get_user_data/' + username + '/' + imgElement[imgElement.length - 1]);

  $.ajax({
    url: saveDataUrl,
    type: "GET",
  });

  saveButton = document.querySelector('.main-container-username-save');
  saveButton.style.display = 'none';
}

function showSaveButton() {
  saveButton = document.querySelector('.main-container-username-save');
  saveButton.style.display = 'block';
}

function show_info() {
    infoPlace = document.querySelector('.info_place');
    console.log(infoPlace)
    infoPlace.style.display = "flex";
    infoPlace.style.opacity = 1;
}

function close_info() {
    infoPlace = document.querySelector('.info_place');
    console.log(infoPlace)
    infoPlace.style.display = "none";
    infoPlace.style.opacity = 0;
}