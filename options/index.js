(function(){
  function startAuth(){
    chrome.runtime.sendMessage({op: "auth"}, function(response) {
    });
  }
  function saveCheck(id){
    return function(){
      const e = document.getElementById(id);
      chrome.storage.sync.set({
        [id]: e.checked
      }, ()=>{});
    }
  }
  function restoreState(names){
    chrome.storage.sync.get(names, function(result){
      for(let i = 0; i < names.length; ++i){
        document.getElementById(names[i]).checked = result[names[i]];
      }
    });
  }
  document.getElementById('authButton').addEventListener('click', startAuth);
  document.getElementById('reject_url_with_password_form').addEventListener('click', saveCheck('reject_url_with_password_form'));
  document.getElementById('remove_query_from_url').addEventListener('click', saveCheck('remove_query_from_url'));
  restoreState(['reject_url_with_password_form', 'remove_query_from_url']);
})();