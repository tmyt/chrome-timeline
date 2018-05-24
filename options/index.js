function startAuth(){
  chrome.runtime.sendMessage({op: "auth"}, function(response) {
  });
}

document.getElementById('authButton').addEventListener('click', startAuth);
