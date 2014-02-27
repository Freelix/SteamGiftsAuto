/////////////////////////////////
/////// Global Variables ////////
/////////////////////////////////

//var WISHGAMES = new Array("The Political Machine 2012", "Legacy of Kain: Soul Reaver", "Kung Fu Strike - The Warrior's Rise"); // String array TODO: bind with UI
var WISHGAMES = new Array();
var GIFTSPERPAGES = 41;      // number of steam gifts per page
var NUMBEROFPAGES = 3;		 // the number of pages to analyse

/////////////////////////////////
///// EventListeners methods ////
/////////////////////////////////

// Add onclick on the button
document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("btn").addEventListener("click", RequestSteamGifts);
});

//document.addEventListener("DOMContentLoaded", initDB, false);

/////////////////////////////////
/////// Primary methods /////////
/////////////////////////////////

function GetAllWishGames(){
	var element = document.getElementById("wishGamesItems").getElementsByTagName("li");
	var stringElement;
	
	for (var i = 0; i < element.length; i++){
		stringElement = element[i].innerText.substring(0, element[i].innerText.length - 8);
		WISHGAMES.push(stringElement);
	}
}

function RequestSteamGifts(){
	// Get all the games from the list
	GetAllWishGames();
	
	// Connection on the proper website (Page 1)
	var req = new XMLHttpRequest();
	req.open("GET", "http://www.steamgifts.com/", true);
	req.send(null);
	
	// Launching the first http request
	launchRequest(req);
	
	for (var ii = 2; ii <= NUMBEROFPAGES; ii++){
		// Connection on the proper website (Page ii)
		var addReq = new XMLHttpRequest();
		addReq.open("GET", "http://www.steamgifts.com/open/page/" + ii, true);
		addReq.send(null);
		
		// Launching the others http requests
		launchRequest(addReq);
	}
}

function launchRequest(req){
	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200){
			var webPage = req.responseText;
				
			// Convert string to DOM
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(webPage,"text/html");
				
			// Iterate through DOM
			searchingForGames(xmlDoc);
		}
	}
}

function searchingForGames(xmlDoc){
	var nodes = xmlDoc.getElementsByClassName("title");
	var urls = new Array();
	var tabArray = new Array();
	var urlCount = 0;
	
	for (var i = 0; i < GIFTSPERPAGES; i++){
		var element = nodes[i].getElementsByTagName("a");
		
		if ($.inArray(element[0].innerHTML.replace("&amp;","&"), WISHGAMES) > -1){
			console.log(element[0].innerHTML);
			var url = element[0].getAttribute("href");
			urls[urlCount] = url;
			urlCount = urlCount + 1;
		}
	}
	
	for (var j = 0; j < urls.length; j++){
		chrome.tabs.create({
			url: "http://www.steamgifts.com" + urls[j],
			selected: false
		}, function(tab){
			chrome.tabs.executeScript(tab.id, {
				code: 'if (document.getElementsByClassName("rounded view submit_entry")[0] != null) {' +
					      'var link = document.getElementsByClassName("rounded view submit_entry")[0].innerHTML;' +
					      'if (link.startsWith("Enter to Win!"))' +
						      'document.getElementById("form_enter_giveaway").submit();' +
					  '}'
			}, function (result){
				 setTimeout(function(){chrome.tabs.remove(tab.id);}, 2500);
			});	
			
		});
	}
	
	console.log("End");
}

/////////////////////////////////
////// Additionals methods //////
/////////////////////////////////

// Add a function to the Array object
Array.prototype.contains = function(obj){
    var i = this.length;
    while (i--){
        if (this[i] === obj){
            return true;
        }
    }
    return false;
}

// Check if the string starts with the giving parameter
// ex: "Someting".startsWith("Lib"); // False
// ex: "Someting".startsWith("Som"); // True
if (typeof String.prototype.startsWith != 'function'){
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

// Print the entire page content
function PrintDOM(xmlDoc){
	console.log("\n------------------------Start DOM------------------------\n");
	console.log(xmlDoc);
	console.log("\n------------------------Stop  DOM------------------------\n");
}