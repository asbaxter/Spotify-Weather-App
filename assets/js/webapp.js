var redirect_uri =
  "https://patrickgp.github.io/Spotify-Weather-App/webapp.html"; // add your local machines url for webapp.html

// add spotify developer credintials here
var client_id = "01b7c0e323ad420d92642e02a58fc217";
var client_secret = "7578aff23ba44f92b111a9e49466abfe";

var access_token = null;
var refresh_token = null;

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";

function onPageLoad() {
  localStorage.setItem("client_id", client_id);
  localStorage.setItem("client_secret", client_secret);

  if (window.location.search.length > 0) {
    handleRedirect();
  }
}

function handleRedirect() {
  let code = getCode();
  fetchAccessToken(code);
  window.history.pushState("", "", redirect_uri);
}

function fetchAccessToken(code) {
  let body = "grant_type=authorization_code";
  body += "&code=" + code;
  body += "&redirect_uri=" + encodeURI(redirect_uri);
  body += "&client_id=" + client_id;
  body += "&client_secret=" + client_secret;
  callAuthorizationApi(body);
}

function refreshAccessToken() {
  refresh_token = localStorage.getItem("refresh_token");
  let body = "grant_type=refresh_token";
  body += "&refresh_token=" + refresh_token;
  body += "&client_id=" + client_id;
  callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", TOKEN, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.setRequestHeader(
    "Authorization",
    "Basic " + btoa(client_id + ":" + client_secret)
  );
  xhr.send(body);
  xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse() {
  if (this.status == 200) {
    var data = JSON.parse(this.responseText);
    var data = JSON.parse(this.responseText);
    if (data.access_token != undefined) {
      access_token = data.access_token;
      localStorage.setItem("access_token", access_token);
    }
    if (data.refresh_token != undefined) {
      refresh_token = data.refresh_token;
      localStorage.setItem("refresh_token", refresh_token);
    }
    onPageLoad();
  } else {
    console.log(this.responseText);
    alert(this.responseText);
  }
}

function getCode() {
  let code = null;
  const queryString = window.location.search;
  if (queryString.length > 0) {
    const urlParams = new URLSearchParams(queryString);
    code = urlParams.get("code");
  }
  return code;
}

function requestAuthorization() {
  localStorage.setItem("client_id", client_id);
  localStorage.setItem("client_secret", client_secret);

  let url = AUTHORIZE;
  url += "?response_type=code";
  url += "&client_id=" + client_id;
  url +=
    "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
  url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
  url += "&show_dialog=true";
  window.location.href = url;
}

function callApi(method, url, body, callback) {
  let xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", "Bearer " + access_token);
  xhr.send(body);
  xhr.onload = callback;
}

function pickPlaylist(playlistIdentifier) {
  const PLAYLIST = "https://api.spotify.com/v1/playlists/" + playlistIdentifier;
  function refreshPlaylist() {
    callApi("GET", PLAYLIST, null, handlePlaylistResponse);
  }

  function handlePlaylistResponse() {
    if (this.status == 200) {
      var data = JSON.parse(this.responseText);
      displaySongs(data);
    } else if (this.status == 401) {
      refreshAccessToken();
    } else {
      console.log(this.responseText);
      alert(this.responseText);
    }
  }

  refreshPlaylist();
}

let count = 0;
let refreshList = 0;
let songList = document.querySelector("#song-list");
let previousSongs = [];

function displaySongs(data) {
  for (let i = 0; i < 5; i++) {
    const playlist = data.tracks.items.length;
    let randomSong = Math.floor(Math.random() * playlist);

    const songListItem = document.createElement("div");
    const albumArt = document.createElement("img");
    const songName = document.createElement("div");
    const artistName = document.createElement("div");
    const trackPlayer = document.createElement("div");
    const songPreview = document.createElement("audio");
    const playPause = document.createElement("button");

    albumArt.src = data.tracks.items[randomSong].track.album.images[1].url;
    songName.textContent = data.tracks.items[randomSong].track.name;
    artistName.textContent =
      data.tracks.items[randomSong].track.artists[0].name;

    songListItem.setAttribute("id", "song-list-item");
    albumArt.setAttribute("id", "album-art");
    songName.setAttribute("id", "song-name");
    artistName.setAttribute("id", "artist-name");
    trackPlayer.setAttribute("id", "track-player");
    songPreview.setAttribute("id", "song-preview");
    playPause.setAttribute("id", "play-pause");
    playPause.textContent = "Play/Pause";

    songList.appendChild(songListItem);
    songListItem.appendChild(albumArt);
    songListItem.appendChild(songName);
    songListItem.appendChild(artistName);
    songListItem.appendChild(trackPlayer);
    trackPlayer.appendChild(playPause);
    playPause.onclick = function () {
      if (count == 0) {
        count = 1;
        songPreview.play();
      } else {
        count = 0;
        songPreview.pause();
      }
    };

    trackPreview = data.tracks.items[randomSong].track.preview_url;

    // checks if song preview exists and if song has already been selected previously
    if (trackPreview === null || previousSongs.includes(randomSong)) {
      songList.removeChild(songListItem);
      i--;
    } else {
      if (refreshList > 0) {
        //songList.removeChild(songListItem);
        songList.removeChild(songList.firstElementChild);
      }
      previousSongs.push(randomSong);
      songPreview.src = trackPreview;
      trackPlayer.appendChild(songPreview);
    }
  }

  refreshList++;
  return songListItem;
}

// OPENWEATHER API

// This variable will hold the user searched city
var city = "";

// Defining my variables
var searchCity = $("#searchCity");
var searchButton = $("#searchButton");
var clearButton = $("#clearHistory");
var currentCity = $("#currentCity");
var currentWeatherIcon = $("#icon");
var currentTemperature = $("#temperature");
var currentWeatherConditions = $("#weatherCondition");
var currentHumidity = $("#humidity");
var savedCities = [];

// This loop searches the city to see if it exists in the "saved city search"
function find(city) {
  for (var i = 0; i < savedCities.length; i++) {
    if (city.toUpperCase() === savedCities[i]) {
      return -1;
    }
  }
  return 1;
}

// API Key
var APIKey = "3f4c7d14daab872155f896009f745a0a";

// Get the city inputted by the user
function displayWeather(event) {
  event.preventDefault();
  if (searchCity.val().trim() !== "") {
    city = searchCity.val().trim();
    currentWeather(city);
  }
}

// Get the current weather conditions by city
function currentWeather(city) {
  var queryURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${APIKey}&units=imperial`;
  $.ajax({
    url: queryURL,
    method: "GET",
  }).then(function (response) {
    for (i = 0; i < 5; i++) {
      var date = new Date(
        response.list[(i + 1) * 8 - 1].dt * 1000
      ).toLocaleDateString();
      var temp = response.list[(i + 1) * 8 - 1].main.temp_max;
      var weatherCondition = response.list[0].weather[0].main;
      var humidity = response.list[(i + 1) * 8 - 1].main.humidity;
      var iconcode = response.list[(i + 1) * 8 - 1].weather[0].icon;
      var iconurl = `http://openweathermap.org/img/wn/${iconcode}.png`;
    }
    var lat = response.city.coord.lat;
    var lon = response.city.coord.lon;
    var weatherIcon = response.list[0].weather[0].icon;
    var iconurl = `http://openweathermap.org/img/wn/${weatherIcon}.png`;
    var date = new Date(response.list[0].dt * 1000).toLocaleDateString();
    $(currentCity).html(response.city.name);
    var temp = response.list[0].main.temp;
    $(currentWeatherIcon).html("<img src=" + iconurl + ">");
    $(currentTemperature).html(temp.toFixed(2) + "&#8457");
    $(currentHumidity).html(response.list[0].main.humidity + "%");
    $(currentWeatherConditions).html(weatherCondition);

    if (response.cod == 200) {
      savedCities = JSON.parse(localStorage.getItem("cityname"));
      if (savedCities == null) {
        savedCities = [];
        savedCities.push(city.toUpperCase());
        localStorage.setItem("cityname", JSON.stringify(savedCities));
        addToList(city);
      } else {
        if (find(city) > 0) {
          savedCities.push(city.toUpperCase());
          localStorage.setItem("cityname", JSON.stringify(savedCities));
          addToList(city);
        }
      }
    }
    pickWeatherSong(response);
  });
}

// Add city to search history
function addToList(city) {
  var listEl = $("<li>" + city.toUpperCase() + "</li>");
  $(listEl).attr("class", "list-group-item");
  $(listEl).attr("data-value", city.toUpperCase());
  $(".list-group").append(listEl);
}

// Display past search items
function pastSearch(event) {
  var liEl = event.target;
  if (event.target.matches("li")) {
    city = liEl.textContent.trim();
    currentWeather(city);
  }
}

// start function
function previousCity() {
  $("ul").empty();
  var savedCities = JSON.parse(localStorage.getItem("cityname"));
  if (savedCities !== null) {
    savedCities = JSON.parse(localStorage.getItem("cityname"));
    for (i = 0; i < savedCities.length; i++) {
      addToList(savedCities[i]);
    }
    city = savedCities[i - 1];
    currentWeather(city);
  }
}

// Clear previous search history
function clearHistory(event) {
  event.preventDefault();
  savedCities = [];
  localStorage.removeItem("cityname");
  document.location.reload();
  location.href = "";
}

// Tie weather condition with playlist options
function pickWeatherSong(response) {
  var weathercondition = response.list[0].weather[0].main;
  if (weathercondition == "Thunderstorm") {
    let playlistIdentifier = "37i9dQZF1DX8sGALGjOrTu?si=a6b5190c40564e92";
    pickPlaylist(playlistIdentifier);
  } else if (weathercondition == "Drizzle") {
    let playlistIdentifier = "0vvXsWCC9xrXsKd4FyS8kM?si=62e880870c9243c8";
    pickPlaylist(playlistIdentifier);
  } else if (weathercondition == "Rain") {
    let playlistIdentifier = "2gfqKlN3egeoGpY9ht06Av?si=25795cf6746e4cd4";
    pickPlaylist(playlistIdentifier);
  } else if (weathercondition == "Snow") {
    let playlistIdentifier = "5l6rFyXN63iINVsbaBObag?si=a6bdf02e357c497e";
    pickPlaylist(playlistIdentifier);
  } else if (weathercondition == "Clear") {
    let playlistIdentifier = "5jKkHPUXGZHitWujNXQREE?si=2fc0da716e214daa";
    pickPlaylist(playlistIdentifier);
  } else if (weathercondition == "Clouds") {
    let playlistIdentifier = "37i9dQZF1DX6ALfRKlHn1t?si=064ed72681e64618";
    pickPlaylist(playlistIdentifier);
  } else {
    let playlistIdentifier = "62wW67yRcDrZunRQlgzsqU?si=15e7275936c949ea";
    pickPlaylist(playlistIdentifier);
  }
}

$("#searchButton").on("click", displayWeather);
$(document).on("click", pastSearch);
$(window).on("load", previousCity);
$("#clearHistory").on("click", clearHistory);

onPageLoad();
