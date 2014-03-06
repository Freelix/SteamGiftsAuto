//////////////////
// Namespace to encapsulate the database logic
//////////////////

var html5DB = {};
html5DB.indexedDB  = {};

//////////////////
// Opening/Creating an Object Store
//////////////////

html5DB.indexedDB.open = function() {
  var version = 1;
  var request = indexedDB.open("wishGamesDB", version);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = function(e) {
	var db = e.target.result;

	// A versionchange transaction is started automatically.
    e.target.transaction.onerror = html5DB.indexedDB.onerror;

	// Create "wishGames"
	if(db.objectStoreNames.contains("wishGames")) {
	  db.deleteObjectStore("wishGames");
	}

	var storeWishGames = db.createObjectStore("wishGames",
	  {keyPath: "timeStamp"}); // Property that makes an individual object in the store unique

	// Create "numberPage"
	if(db.objectStoreNames.contains("numberPage")) {
	  db.deleteObjectStore("numberPage");
	}

	var storeNumberPage = db.createObjectStore("numberPage",
	  {keyPath: "uniqueNumberOfPage"}); // Property that makes an individual object in the store unique
	  
	storeNumberPage.createIndex("uniqueNumberOfPage", "uniqueNumberOfPage", { unique: true });
  };

  request.onsuccess = function(e) {
	html5DB.indexedDB.db = e.target.result;
    html5DB.indexedDB.getAllWishGames();
	html5DB.indexedDB.loadNumberOfPage();
  };

  request.onerror = html5DB.indexedDB.onerror;
};

//////////////////
// Adding data to an object store
//////////////////

html5DB.indexedDB.addWishGames = function(newGame) {

	// Execute the function IsGameAlreadyExist to attribute a value
	// to the variable isExisting before proceed to the next line
	
	if (newGame.trim() == ""){
		setMessage("Red", "You must enter a name");
	}
	else{
		IsGameAlreadyExist(newGame, function (isExisting) {
			var db = html5DB.indexedDB.db;
			var trans = db.transaction(["wishGames"], "readwrite");
			var store = trans.objectStore("wishGames");

			if (!isExisting){
				var request = store.put({
					"text": newGame,
					"timeStamp" : new Date().getTime() // timeStamp property, that is our unique key for the object
				});

				request.onsuccess = function(e) {
					html5DB.indexedDB.getAllWishGames();
					
					// if the game is not in the wish list
					setMessage("Green", "This game was added to your wish list !");
				};

				request.onerror = function(e) {
					console.log(e.value);
				};
			}
		});
	}
};

//////////////////
// Querying the data in a store
//////////////////

html5DB.indexedDB.getAllWishGames = function() {
  var gameList = document.getElementById("wishGamesItems");
  gameList.innerHTML = "";

  var db = html5DB.indexedDB.db;
  var trans = db.transaction(["wishGames"], "readwrite");
  var store = trans.objectStore("wishGames");

  // Get everything in the store
  var cursorRequest = store.openCursor();

  // Loop in everything in the store 
  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false)
      return;

    renderWishGames(result);
    result.continue();
  };

  cursorRequest.onerror = html5DB.indexedDB.onerror;
};

//////////////////
// Querying to know if the game already exist in the object store
//////////////////

function IsGameAlreadyExist(gameToAdd, oncomplete){
	var db = html5DB.indexedDB.db;
	var transaction = db.transaction("wishGames");
	var objectStore = transaction.objectStore("wishGames");
	
	var exists = false;

	objectStore.openCursor().onsuccess = function(event) {
	  var cursor = event.target.result;
	  
	  // Check if there's data
	  if (cursor) {
	    // if the game is already in the wish list
		if (cursor.value.text == gameToAdd){
			setMessage("Red", "This game is already in your wish list")
			exists = true;
		}
		cursor.continue();
	  }
	};
	
	transaction.oncomplete = function () {
		// Apply the value exists to the variable oncomplete
        oncomplete(exists);
    };
}

//////////////////
// Rendering data from an Object Store
//////////////////

function renderWishGames(row) {
  var gameList = document.getElementById("wishGamesItems");
  var li = document.createElement("li");
  var a = document.createElement("a");
  var t = document.createTextNode();
  t.data = row.value.text;
  
  // For some reasons, we cannot pass row.key directly
  var id = row.key;

  a.textContent = "[Delete]";
  a.setAttribute("href", "#");
  a.style.marginLeft = "5px";
  a.style.color = "Orange";
  a.style.textDecoration = "none";
  
  li.appendChild(t);
  li.appendChild(a);
  gameList.appendChild(li);
  
  a.addEventListener("click", function(event) {
	html5DB.indexedDB.deleteWishGame(id);
  });
}

//////////////////
// Deleting data from an Object Store
//////////////////

html5DB.indexedDB.deleteWishGame = function(id) {
  var db = html5DB.indexedDB.db;
  var trans = db.transaction(["wishGames"], "readwrite");
  var store = trans.objectStore("wishGames");

  var request = store.delete(id);

  request.onsuccess = function(e) {
    html5DB.indexedDB.getAllWishGames();
	setMessage("Green", "This game has been successfully deleted !")
  };

  request.onerror = function(e) {
    console.log(e);
  };
};

//////////////////
// Save/load the current number of pages
//////////////////

html5DB.indexedDB.saveNumberOfPage = function(){
	var db = html5DB.indexedDB.db;
	var trans = db.transaction(["numberPage"], "readwrite");
	var store = trans.objectStore("numberPage");
	
	if(document.getElementById("nbPage").value > 0 && document.getElementById("nbPage").value < 7){
		var request = store.put({
		    "numberOfPage": document.getElementById("nbPage").value,
			"uniqueNumberOfPage": 1 // Stores only one data
		});

		setBlank();
		
		request.onerror = function(e){
			console.log(e.value);
		};
	}
	else{
		setMessage("Red", "Le nombre de pages n'est pas conforme");
	}
}

html5DB.indexedDB.loadNumberOfPage = function(){
	var db = html5DB.indexedDB.db;
	var trans = db.transaction(["numberPage"], "readwrite");
	var store = trans.objectStore("numberPage");
	
	var index = store.index("uniqueNumberOfPage");
	
	index.get(1).onsuccess = function(event) {
		document.getElementById("nbPage").value = event.target.result.numberOfPage;
	};
}

//////////////////
// Setting the message to show with the appropriate color
//////////////////

function setMessage(color, textToShow){
	document.getElementById("messages").style.color = color;
	document.getElementById("messages").innerText = textToShow;
}

function setBlank(){
	document.getElementById("messages").innerText = "";
}

//////////////////
// Page load
//////////////////

function initDB() {
  html5DB.indexedDB.open(); // open and displays the data previously saved
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("btnDB").addEventListener("click", addGame);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("nbPage").addEventListener("click", html5DB.indexedDB.saveNumberOfPage);
});

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("nbPage").addEventListener("change", html5DB.indexedDB.saveNumberOfPage);
});

document.addEventListener("DOMContentLoaded", initDB, false);

//////////////////
// Take the data from the user's input
//////////////////

function addGame() {
  var gameToAdd = document.getElementById('gameToAdd');

  html5DB.indexedDB.addWishGames(gameToAdd.value);
  gameToAdd.value = '';
}