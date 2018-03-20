$(document).ready(function() {
  initMap();
  current_location();

  $(".get-info").on("click", showPopUp);
  $(".pop-up .close").on("click", closePopUp);
  $(".get-a-tour").on("click", getTour);
});

var map, marker;
var check_marker = 0;
var source;
var curPos, newPos;
function initMap() {
  map = document.getElementById("map");
  if(!map) {
    console.warn("No #map element found");
    return;
  }

  map = new google.maps.Map(map, {
    center: {lat: -34.397, lng: 150.644},
    zoom: 25
  });

  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng);
  });
}

function placeMarker(location) {
  if(check_marker == 1) {
    marker.setMap(null);
  }

  marker = new google.maps.Marker({
    position: location,
    map: map
  });

  if(typeof location.lat ==="function") {
    var dest = {
      lat : location.lat(),
      lng : location.lng(),
    };
  }
  else {
    var dest = {
      lat : location.lat,
      lng : location.lng,
    }
  }
  map.setCenter(dest);
  console.log(dest);
  // _showPopUp(dest);
  check_marker = 1;
}

function current_location() {
  if(!navigator.geolocation) {
    console.log("No navigator.geolocation found.\nCannot load map.");
    return;
  }

  if(!map) {
    console.warn("No #map element found");
    return;
  }

  // Try HTML5 geolocation.
  navigator.geolocation.getCurrentPosition(function(position) {
    source = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    curPos = source
    newPos = curPos;
    $.post('/api/updateTour', curPos, function(data, response) {

    });
    initInterval();
    placeMarker(source);
  }, function(error) {
    if(error)
      console.log("Fail");
      console.log(error);
  });
}

function showPopUp() {
  if(!curPos) return;

  _showPopUp(curPos);
}

function _showPopUp(dest) {
  // newPos = dest;
  $.get("/api/locationInfo", dest, function(data, response) {
    // if(response=='success') {
      openPopUp(data.locationTag, data.info);
    // }
  })
}

function closePopUp() {
  var $popUp = $(".pop-up-container.open");
  $popUp.removeClass("open");
  $popUp.find(".title").text("");
  $popUp.find(".content").text("");
}

function openPopUp(title, content) {
  var $popUp = $(".pop-up-container");
  $popUp.find(".title").text(title);
  $popUp.find(".content").text(content);
  $popUp.addClass("open");
}

function initInterval() {
  var locationInterval = window.setInterval(function() {
    var temp;
    navigator.geolocation.getCurrentPosition(function(position) {
      var source = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      temp = source;
      if( (Math.abs(temp.lat - curPos.lat) <= 0.0000005) && (Math.abs(temp.lat - curPos.lat) <= 0.00000005) ) {
        return;
      }
      else {
        newPos = temp;
        curPos = newPos;
        placeMarker(newPos);
        $.post("/api/updateTour", newPos,function(data, response) {});
      }
    }, function(error) {
      if(error)
        console.log("Fail");
    });
  }, 2000);
}

function getTour(){
  var startPoint;
  if(curPos !== undefined) {
    startPoint = curPos;
  }
  else {
    alert("Something is wrong.");
    return;
  }

  $.post("api/tour", curPos, function(data, response){

    /*Deora - make changes here*/
    console.log(response, data);
    if(response == "success") {
      // Just for the looks.
      var strokeColors = ["red", "blue", "black", "green", "yellow"];
      var strokeColorSize = strokeColors.length;
      // data is an array of paths.
      for(var i = 0;i < data.length;i++) {
        // Plot the path using simple polylines
        var pathCoordinates = data[i];
        console.log(pathCoordinates);
        var color = strokeColors[i%strokeColorSize];
        console.log(color);
        var path = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 2
        });

        path.setMap(map);
      }
    }
    else {
      console.error("Could not get a tour.");
    }
  });
}
