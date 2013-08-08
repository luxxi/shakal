// This sample is using jso.js from https://github.com/andreassolberg/jso

var deviceready = function() {
	var debug = true,
	fbLoginBtn = document.getElementById("fbLoginBtn"),
	inAppBrowserRef;
    
	jso_registerRedirectHandler(function(url) {
		inAppBrowserRef = window.open(url, "_blank");
		inAppBrowserRef.addEventListener('loadstop', function(e) {
			LocationChange(e.url)
		}, false);
	});

	/*
	* Register a handler that detects redirects and
	* lets JSO to detect incomming OAuth responses and deal with the content.
	*/
    
	function LocationChange(url) {
		outputlog("in location change");
		url = decodeURIComponent(url);
		outputlog("Checking location: " + url);

		jso_checkfortoken('facebook', url, function() {
			outputlog("Closing InAppBrowser, because a valid response was detected.");
			inAppBrowserRef.close();
            
		});
	};

	/*
	* Configure the OAuth providers to use.
	*/
	//417521095034048
	//537761576263898
	jso_configure({
		"facebook": {
			client_id: "537761576263898",
			redirect_uri: "http://www.facebook.com/connect/login_success.html",
			authorization: "https://www.facebook.com/dialog/oauth",
			presenttoken: "qs"
		}
	}, {"debug": debug});
    
	// jso_dump displays a list of cached tokens using outputlog if debugging is enabled.
	jso_dump();
    
	fbLoginBtn.addEventListener("click", function() {
		// For debugging purposes you can wipe existing cached tokens...
		jso_ensureTokens({
			"facebook": ["read_stream", "publish_stream", "email"]
		});
        console.log(GetUserData());
	});
};

function GetUserData() {
	$.oajax({
		url: "https://graph.facebook.com/me",
		jso_provider: "facebook",
		jso_scopes: ["read_stream", "publish_stream", "email"],
		jso_allowia: true,
		dataType: 'json',
		success: function(data) {
			LoginFacebook(data);
		}
	});
}

function outputlog(m) {
	var resultsField = document.getElementById("result");
	resultsField.innerText += typeof m === 'string' ? m : JSON.stringify(m);
	resultsField.innerText += '\n';
}

function outputclear() {
	var resultsField = document.getElementById("result");
	resultsField.innerText = "";
}

document.addEventListener('deviceready', this.deviceready, false);

//Activate :active state
document.addEventListener("touchstart", function() {
}, false);