const AuthorizeUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    , RedirectUrl = chrome.identity.getRedirectURL()
    , ClientId = '02a9023b-5630-4e88-83cc-bcd7629c6cf6'
    , ClientSecret = 'csbRA707*wkxpTXNAQ55:?$'
    , Scope = 'UserActivity.ReadWrite.CreatedByApp offline_access';

function queryString(args){
  const keys = Object.keys(args);
  return keys.map(k => `${k}=${encodeURIComponent(args[k])}`).join('&');
}

function formatUrl(url, args){
  return `${url}?${queryString(args)}`;
}

function getToken(args){
  const body = queryString(args);
  return new Promise(done => {
    fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      body: body,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST'
    }).then(r => r.json())
    .then(r => {
      if(r.token_type){
        chrome.storage.sync.set({
          access_token: r.access_token,
          refresh_token: r.refresh_token,
        }, done);
      }
    });
  });
}

function getTokenWithRefreshToken(refreshToken){
  return getToken({
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken,
    'client_id': ClientId,
    'client_secret': ClientSecret,
    'redirect_uri': RedirectUrl,
  });
}

function getTokenWithCode(code){
  return getToken({
    'grant_type': 'authorization_code',
    'code': code,
    'client_id': ClientId,
    'client_secret': ClientSecret,
    'redirect_uri': RedirectUrl,
  });
}

function makeActivity(activity){
  const uri = activity.uri;
  const date = new Date().toISOString();
  return {
    "appActivityId": activity.id,
    "activitySourceHost": activity.host,
    "userTimezone": "America/Los Angeles",
    "appDisplayName": "Chrome",
    "activationUrl": uri,
    "fallbackUrl": uri,
    "contentInfo": {
      "@context": "http://schema.org",
      "@type": "CreativeWork",
      "author": "Jennifer Booth",
      "name": "Graph Explorer User Activity"
    },
    "visualElements": {
        "attribution": {
            "iconUrl": activity.icon || "https://www.google.com/images/icons/product/chrome-32.png",
            "alternateText": activity.title || activity.uri,
            "addImageQuery": "false",
        },
        "description": activity.description || "",
        "backgroundColor": "#4F8CF5",
        "displayText": activity.title || activity.uri,
        "content": {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "backgroundImage": activity.image,
            "body":
            [{
                "type": "TextBlock",
                "size": "large",
                "weight": "bolder",
                "text": activity.title,
                "wrap": true,
                "maxLines": 3
            },{
                "type": "TextBlock",
                "text": uri,
                "wrap": true,
                "maxLines": 3
            }]
        }
    },
    "historyItems":[
      {
          "userTimezone": "America/Los Angeles",
          "startedDateTime": date,
          "lastActiveDateTime": date,
      }
    ]
  };
}

function putCore(activity, pair){
  const data = makeActivity(activity);
  fetch('https://graph.microsoft.com/v1.0/me/activities/' + encodeURIComponent(activity.id), {
    body: JSON.stringify(data),
    cache: 'no-cache',
    headers: {
      'authorization': `Bearer ${pair.access_token}`,
      'content-type': 'application/json',
    },
    method: 'PUT',
  })
  .then(r => {
    if(r.status === 401){
      // try to refresh
      getTokenWithRefreshToken(pair.refresh_token)
      .then(_ => putTimeline({activity}));
    }else{
      // ok
    }
  });
}

function putTimeline(message){
  chrome.storage.sync.get(['access_token', 'refresh_token', 'reject_url_with_password_form', 'remove_query_from_url'], function(result){
    if(!result.access_token) return;
    if(result.reject_url_with_password_form && message.activity.hasPasswords) return;
    if(result.remove_query_from_url){
      message.activity.uri = message.activity.uri.replace(/\?.*$/, '');
    }
    putCore(message.activity, result);
  });
}

function startAuth(){
  const url = formatUrl(AuthorizeUrl, {
    'client_id': ClientId,
    'response_type': 'code',
    'redirect_uri': RedirectUrl,
    'response_mode': 'query',
    'scope': Scope,
  });
  chrome.identity.launchWebAuthFlow(
    {
      'url': url,
      'interactive': true
    }, redirect_url => {
      const code = (redirect_url.match(/code=([^&]+)/))[1];
      getTokenWithCode(code);
    }
  );
}

chrome.runtime.onMessage.addListener(function(message, callback){
  if(message.op === 'put'){
    putTimeline(message);
  }
  if(message.op === 'auth'){
    startAuth();
  }
});
