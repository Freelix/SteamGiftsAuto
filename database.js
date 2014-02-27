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

    if(db.objectStoreNames.contains("wishGames")) {
      db.deleteObjectStore("wishGames");
    }

    var store = db.createObjectStore("wishGames",
      {keyPath: "timeStamp"}); // Property that makes an individual object in the store unique
  };

  request.onsuccess = function(e) {
    html5DB.indexedDB.db = e.target.result;
    html5DB.indexedDB.getAllWishGames();
  };

  request.onerror = html5DB.indexedDB.onerror;
};

//////////////////
// Adding data to an object store
//////////////////

html5DB.indexedDB.addWishGames = function(newGame) {
  var db = html5DB.indexedDB.db;
  var trans = db.transaction(["wishGames"], "readwrite");
  var store = trans.objectStore("wishGames");
  var request = store.put({
    "text": newGame,
    "timeStamp" : new Date().getTime() // timeStamp property, that is our unique key for the object
  });

  request.onsuccess = function(e) {
    html5DB.indexedDB.getAllWishGames();
  };

  request.onerror = function(e) {
    console.log(e.value);
  };
};

//////////////////
// Querying the data in a store.
//////////////////

html5DB.indexedDB.getAllWishGames = function() {
  var gameList = document.getElementById("wishGamesItems");
  gameList.innerHTML = "";

  var db = html5DB.indexedDB.db;
  var trans = db.transaction(["wishGames"], "readwrite");
  var store = trans.objectStore("wishGames");

  // Get everything in the store
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  // Loop in everything in the store 
  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false)
      return;

    renderTodo(result);
    result.continue();
  };

  cursorRequest.onerror = html5DB.indexedDB.onerror;
};

//////////////////
// Rendering data from an Object Store
//////////////////

function renderTodo(row) {
  var gameList = document.getElementById("wishGamesItems");
  var li = document.createElement("li");
  var a = document.createElement("a");
  var t = document.createTextNode();
  t.data = row.value.text;
  var id = row.key;

  a.textContent = " [Delete]";
  a.setAttribute("href", "#");
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
    html5DB.indexedDB.getAllWishGames();  // Refresh the screen
  };

  request.onerror = function(e) {
    console.log(e);
  };
};

//////////////////
// Page load
//////////////////

function initDB() {
  html5DB.indexedDB.open(); // open and displays the data previously saved
}

// Add onclick on the button
document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("btnDB").addEventListener("click", addGame);
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
