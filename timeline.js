(function(){
  function og(meta){
    const ret = {};
    for(let i = 0; i < meta.length; ++i){
      const prop = meta[i].attributes.property;
      if(!prop) continue;
      if(prop.value.startsWith('og:')){
        ret[prop.value] = meta[i];
      }
    }
    return ret;
  }

  function rel(link){
    const ret = {};
    for(let i = 0; i < link.length; ++i){
      ret[link[i].rel] = link[i];
    }
    return ret;
  }

  function findPasswordForm(){
    const tags = document.getElementsByTagName('input');
    for(let i = 0; i < tags.length; ++i){
      if(tags[i].type === 'password') return true;
    }
    return false;
  }

  function main(){
    const ogProp = og(document.getElementsByTagName('meta'));
    const links = rel(document.getElementsByTagName('link'));
    const activity = {
      id: location.href.replace(/\//g, '_'),
      uri: location.href,
      title: document.title,
      host: location.origin,
      description: (ogProp['og:description'] || {}).content,
      image: (ogProp['og:image'] || {}).content,
      icon: (links['icon'] || {}).href,
      hasPasswords: findPasswordForm(),
    };
    chrome.runtime.sendMessage({op: "put", activity}, function(response) {});
  }

  // push activity after 90sec
  setTimeout(main, 90 * 1000);
})();