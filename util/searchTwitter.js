


var backgroundPage = null;
var devUrl = "https://api.twitter.com/1.1/search/tweets.json";
var localURL = "http://127.0.0.1:8000/gbfraidfinder/"
var credentials = "AAAAAAAAAAAAAAAAAAAAAK1f8AAAAAAAXn%2F29tqwKZEMGJZDMSx34Jd9mo0%3DvTleofUqiOklKNOTrZpQZt0R67AunOAapHs7IUlq29PkQ1DlC9";
credentials = "Bearer " + credentials;
var devOptions = "result_type=recent&include_entities=false&count=20";
var url = "https://twitter.com/search";
var options = "f=tweets&result_type=recent"
// var query = "q=Lvl 120 Europa"
var lastId = null;

// https://twitter.com/search?f=tweets&vertical=default&q=dog%20OR%20cat&src=typd
// https://twitter.com/search?f=tweets&vertical=default&q=dog%20OR%20cat&src=typd&result_type=recent

//4188B81E :参戦ID 参加者募集！ Lv120 エウロペ https://t.co/AXSdWWAVVa
var tweetJapRegEx = new RegExp("(?<message>.+\\s)?(?<id>[\\dA-Za-z]+)\\s\\:参戦ID\\s+参加者募集！\\s+(?<room>Lv\\d+\\s+\\S+)\\s+.+");
//04E07E9C :Battle ID I need backup! Lvl 120 Europa https://t.co/Fc1pn9qjnf
var tweetEngRegEx = new RegExp("(?<message>.+\\s)?(?<id>[\\dA-Za-z]+)\\s+\\:Battle\\s+ID\\s+I\\s+need\\s+backup!\\s+(?<room>Lvl\\s+\\d+(\\s+\\S+)+)\\s+.+");

chrome.runtime.getBackgroundPage(function(tempBackgroundPage) {
	backgroundPage = tempBackgroundPage;
});

function newDevRequestCallback(req) {
    return function() { 
    	if (req.readyState == XMLHttpRequest.DONE) {
    		backgroundPage.midQuery = false;
    		raidList = new Array();
	        var tweets = JSON.parse(req.responseText).statuses;
	        if (!tweets)
	        	return;
	        var tweetNum = tweets.length;
			for (var i = 0; i < tweetNum; i++) {
				var raid = {
					id: "",
					user: "",
					time: "",
					room: "",
					message: "No twitter message.",
					language: "",
					status: "unclicked",
					time: 0
				}
				var tweet = tweets[i];
				var language, match;
				if (tweetJapRegEx.test(tweet.text)) {
					match = tweetJapRegEx.exec(tweet.text);
					raid.room = backgroundPage.FindRaidConfigJP(match.groups.room).room;
					raid.language = "JP";
				} else if (tweetEngRegEx.test(tweet.text)) {
					match = tweetEngRegEx.exec(tweet.text);
					raid.room = backgroundPage.FindRaidConfigEN(match.groups.room).room;
					raid.language = "EN";
				} else {
					console.log("Couldn't parse tweet:\n" + tweet.text);
					continue;
				}

				raid.id = match.groups.id;
				if (match.groups.message && match.groups.message.length > 0)
					raid.message = match.groups.message;
				raid.user = "@" + tweet.user.screen_name;
				raid.time = tweet.created_at;
				if (tweet.id > lastId)
					lastId = tweet.id;

				raidList.push(raid);
			}
			backgroundPage.updateRaids(raidList);
		}
    };
}

function newRequestCallback(req) {
    return function() { 
    	if (req.readyState == XMLHttpRequest.DONE) {
	    	raidList = new Array();
			var tempDiv = document.createElement('div');
			tempDiv.innerHTML = req.responseText;
	        var tweets = tempDiv.getElementsByClassName("tweet");
	        var tweetNum = tweets.length;
			for (var i = 0; i < tweetNum; i++) {
				var raid = {
					id: "",
					user: "",
					time: "",
					room: "",
					message: "No twitter message.",
					language: "",
					status: "unclicked",
					time: 0
				}
				var tweet = tweets[i];
				// console.log(tweet.attributes.getNamedItem("data-screen-name").value);
				var tweetText = tweet.getElementsByClassName("tweet-text")[0].innerText;
				var language, match;
				if (tweetJapRegEx.test(tweetText)) {
					match = tweetJapRegEx.exec(tweetText);
					raid.room = backgroundPage.FindRaidConfigJP(match.groups.room).room;
					raid.language = "JP";
				} else if (tweetEngRegEx.test(tweetText)) {
					raid.room = backgroundPage.FindRaidConfigEN(match.groups.room).room;
					match = tweetEngRegEx.exec(tweetText);
					raid.language = "EN";
				} else {
					console.log("Couldn't parse tweet: " + tweetText);
					continue;
				}
				raid.id = match.groups.id;
				raid.user = "@" + tweet.attributes.getNamedItem("data-screen-name").value;
				raid.time = tweet.getElementsByClassName("_timestamp")[0].getAttribute("data-time-ms");
				if (match.groups.message && match.groups.message.length > 0)
					raid.message = match.groups.message;
				lastId = tweet.attributes.getNamedItem("data-tweet-id").value;

				raidList.push(raid);

			}
			backgroundPage.updateRaids(raidList);
		}
    };
}


function fetchNewRaids(query) {
	// if (backgroundPage.showSettings.devMode) {
	var request = new XMLHttpRequest();
	var sinceId = "";
	if (lastId)
		sinceId = "&since_id=" + lastId.toString();

	request.open("GET", localURL + "?" + query + "&" + devOptions + sinceId, true);
	// request.setRequestHeader("Authorization", "Bearer " + credentials);
	// request.setRequestHeader("Authorization", "Bearer " + backgroundPage.showSettings.bearerToken);

	request.onreadystatechange = newDevRequestCallback(request);

	request.send();
	return;
	// } else {
		// var request = new XMLHttpRequest();
		// var sinceId = "";
		// if (lastId)
		// 	sinceId = "&since_id=" + lastId.toString();

		// request.open("GET", url + "?" + options + sinceId + "&" + query, true);

		// request.onreadystatechange = newRequestCallback(request);

		// request.send();
		// return;
	// }
}
