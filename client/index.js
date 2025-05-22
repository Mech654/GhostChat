function choose_username() {
  var username = prompt('Please enter your username', 'Username');
  localStorage.setItem('username', username);
  alert('Your username has been set!');
}

function choose_avatar() {
  var random = Math.floor(Math.random() * 5) + 1;
  if (random == 1) {
    localStorage.setItem('avatar', 'Resources/Uden titel.png');
  } else if (random == 2) {
    localStorage.setItem('avatar', 'Resources/Uden titel2.png');
  } else if (random == 3) {
    localStorage.setItem('avatar', 'Resources/Uden titel3.png');
  } else if (random == 4) {
    localStorage.setItem('avatar', 'Resources/Uden titel4.png');
  } else if (random == 5) {
    localStorage.setItem('avatar', 'Resources/5Uden titel.png');
  }
  alert('Your avatar has been set!');
}

function enter() {
  var username = localStorage.getItem('username');
  var avatar = localStorage.getItem('avatar');
  if (username == null || avatar == null) {
    alert('Please choose a username and avatar before entering the chat');
  } else {
    window.location.href = 'chat.html';
  }
}
