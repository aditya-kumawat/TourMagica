// setup
// var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var favicon = require('serve-favicon');
var request = require('request');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();
var mongoose = require('mongoose');

/**
 * Required for setting up https server.
**/
var privateKey = fs.readFileSync('key.pem');
var certificate = fs.readFileSync('cert.pem')
var credentials = {
  key: privateKey,
  cert: certificate
};

/**
 * Set up the middlewares.
**/
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({secret: "itsASecret"}));

// Use the public folder as the starting point for src tags in our views
app.use(express.static(path.join(__dirname, 'public')));

// Set the path directory for view templates
app.set('views', __dirname + '/public/views');

// Set path for favicon
// app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(express.static(__dirname + '/public'));

/**
 * Connect to the monodb instance.
**/
mongoose.connect('mongodb://127.0.0.1:27017/tourApp', function(err) {
    if(err) {
        console.log("Failed to connect to database");
    } else {
        console.log("Connected to the database");
    }
});

var User = require('./models/user');
var Tour = require('./models/tour');
var Location = require('./models/location');

/**
 * Home Route
**/
app.get('/', function(req, res) {
  if(req.session.tourId) {
    res.sendFile( app.get('views') + '/index.html');
  } else {
    if(req.session.mobileNo) {
    	if(req.session.verified) {
	      res.redirect('/details');
    	}
    	else {
    		res.redirect('/verify');
    	}
    } else {
      res.redirect('/login');
	  }
  }
});

/**
 * Login Route
**/
app.get('/login', function(req, res) {
  if(req.session.tourId) {
    res.redirect('/');
  } else {
    if(req.session.mobileNo) {
    	if(req.session.verified) {
	      res.redirect('/details');
    	}
    	else {
				res.redirect('/verify');
    	}
    } else {
      res.sendFile(app.get('views') + '/login.html');
    }
  }
});

/**
 * Verify Route
**/
app.get('/verify', function(req, res) {
  if(req.session.tourId) {
    res.redirect('/');
  } else {
    if(req.session.mobileNo) {
      if(req.session.verified) {
        res.redirect('/details');
      } else {
        res.sendFile(app.get('views') + '/verify.html');
      }
	  } else {
      res.redirect('/login')
    }
  }
});

/**
 * Details Route
**/
app.get('/details', function(req, res){
  if(req.session.tourId) {
    res.redirect('/');
  } else {
    if(req.session.mobileNo) {
      if(req.session.verified) {
        res.redirect('/details');
      } else {
        res.sendFile( app.get('views') + '/details.html');
      }
    } else {
      res.redirect('/login');
    }
  }
});

/**
 * API Login Route. Works in the backend
**/
app.post('/api/login', function(req, res) {
  var data = req.body.mobileNo;
  var user = new User();
  user.mobileNo = data;
  user.save(function(err) {
    if(err && err.code!=11000) {
      console.log(err);
      res.redirect('/login');
    } else {
      req.session.mobileNo = data;
      res.redirect('/verify');
    }
  });
});

/**
 * API Verify Route. Works in the backend
**/
app.post('/api/verify', function(req, res) {
  var data = req.body.otp;
  User.findOne({mobileNo: req.session.mobileNo}, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect('/verify');
    } else {
      console.log(user);
      if(user.otp==data) {
        res.redirect('/details');
        req.session.verified = true;
      } else {
        res.redirect('/verify');
      }
    }
  });
});

app.post('/api/details', function(req, res) {
  var data = req.body;
  var tour = new Tour();
  if(data) {
    if(data.gender) {
      tour.gender = data.gender;
    }
    if(data.age) {
      tour.age = data.age;
    }
    tour.save(function(err) {
      if(err) {
        console.log(err);
        res.redirect('/details');
      }
    })
    req.session.tourId = tour._id;
  }
  res.redirect('/');
});

app.get('/api/insertLocation', function(req, res) {
    var data = {
        lat: 26.78,
        lng: 75.82,
        locationTag: "Jaipur",
        info: "Hello World. Success",
    }
    var location = new Location(data);
    location.save(function(err) {
        if(err) {
            console.log(err)
        } else {
            console.log("Location info added");
        }
    })
});

app.get('/api/locationInfo', function(req, res) {
  var data = req.query;
  data.lat = parseFloat(data.lat);
  data.lng = parseFloat(data.lng);
  // console.log(data);
  Location.find({
    lat: {$gt: data.lat-0.005, $lt:data.lat+0.005}
  }, function(err, location) {
      // console.log(location);
      if(err) {
          res.send("Unknown location", "Unknown Info");
      } else {
          if(location && location[0]) {
              res.send({locationTag: location[0].locationTag, info: location[0].info});
          } else {
              Location.find({
                  lng: {$gt: data.lng-0.005, $lt:data.lng+0.005}
              }, function(err, location) {
                  // console.log(location);
                  if(err) {
                      res.send("Unknown location", "Unknown Info");
                  } else {
                      if(location && location[0]) {
                          res.send({locationTag: location[0].locationTag, info: location[0].info});
                      } else {
                          res.send({locationTag: "Unknown location", info: "Unknown Info"});
                      }
                  }
              })
          }
      }
  })
});

app.get('/addLocation', function(req, res){
  for (var i = 0; i < 10; i++) {
    var location = new Location();
    location.lat =  Math.random()*100;
    location.lng = Math.random()*100;
    location.info = "This place is know for wars. The battle of bastards was fought here.";
    location.locationTag  = "River-run";
    location.save(function(err){
      if(err){
        console.log(err);
      }
      else {
        console.log("Data added " + i);
      }
    });
  }
   res.send("Hello world");
});

app.post('/api/updateTour', function(req, res) {
  var data = req.body;
  Tour.findById(req.session.tourId, function(err, tour) {
    console.log("Data ");
    console.log(data);
    tour.path.push(data);
    console.log("Path ");
    console.log(tour.path);
    tour.save(function(err) {
      if(err) {
        console.log(err);
      } else {
        res.redirect('/');
      }
    });
  });
});

app.get('/api/addTour', function(req, res){
  Location.find({}, function(err, locations){
    if(err){
      res.send(err);
    }
    else{
      // res.send(locations);
      var tour = new Tour();
      tour.path = [];
      for(var i = 0; i < Math.floor(Math.random()*11); i++) {
        tour.path.push({ lat: locations[i].lat, lng: locations[i].lng});
      }
      tour.age = Math.floor(Math.random()*40);
      tour.gender = "male";
      tour.save(function(err){
        if(err){
          res.send(err);
        }
        else{
          res.send("tour added successfully");
        }
      });
    }
  });
});

app.get('/api/getTour', function(req, res){
  Tour.find({}, function(err, tours){
    if(err){
      res.send(err);
    }
    else {
      console.log(tours);
      // res.send(tours);
      var infoPoints = {};
      for(var i =0; i< tours.length; i++) {
        for(var j =0; j< tours[i].path.length; j++) {
          var currLat = tours[i].path[j].lat;
          var currLong = tours[i].path[j].lng;
          if(infoPoints.hasOwnProperty( String(currLat) + " " + String(currLong) ) ) {
            infoPoints[String(currLat) + " " + String(currLong)].push(j);
          }
          else {
            infoPoints[String(currLat) + " " + String(currLong)] = [];
            infoPoints[String(currLat) + " " + String(currLong)].push(j);
          }
        }
      }
      // console.log(infoPoints);
      var numPoints = Object.keys(infoPoints).length;
      // console.log("number of points = "+ numPoints);
      var finalPath = [];

      for(var i = 0; i< numPoints; i++) {
        var maxCount = 0;
        var keyToKeep = "";
        for(var key in infoPoints) {
          var count = 0;
          for(var j =0; j< infoPoints[key].length; j++) {
            if(infoPoints[key][j] == i)
              count++;
          }
          if(count>maxCount) {
            maxCount = count;
            keyToKeep = key;
          }
        }
        finalPath.push(keyToKeep);
      }

      console.log(finalPath);
      resultPath = [];
      for(var i = 0;i < finalPath.length;i++) {
        var arr = finalPath[i].split(" ");
        resultPath.push({
          lat: parseFloat(arr[0]),
          lng: parseFloat(arr[1])
      });
      }
      console.log(resultPath);
      res.send(resultPath);
    }
  });
});

app.get('/checkDataset', function(req, res){
  fs.readFile('tours.txt', 'utf8', function(err, data) {
    if (err) throw err;
    var tours = JSON.parse(data);
    // res.send(tours);
    var infoPoints = {};
    for(var i =0; i< tours.length; i++) {
      for(var j =0; j< tours[i].path.length; j++) {
        var currLat = tours[i].path[j].lat;
        var currLong = tours[i].path[j].lng;
        if(infoPoints.hasOwnProperty( String(currLat) + " " + String(currLong) ) ) {
          infoPoints[String(currLat) + " " + String(currLong)].push(j);
        }
        else {
          infoPoints[String(currLat) + " " + String(currLong)] = [];
          infoPoints[String(currLat) + " " + String(currLong)].push(j);
        }
      }
    }
    // console.log(infoPoints);
    var numPoints = Object.keys(infoPoints).length;
    // console.log("number of points = "+ numPoints);
    var finalPath = [];

    for(var i = 0; i< numPoints; i++) {
      var maxCount = 0;
      var keyToKeep = "";
      for(var key in infoPoints) {
        var count = 0;
        for(var j =0; j< infoPoints[key].length; j++) {
          if(infoPoints[key][j] == i)
              count++;
        }
        if(count>maxCount) {
          maxCount = count;
          keyToKeep = key;
        }
      }
      finalPath.push(keyToKeep);
    }

    // console.log(finalPath);
    resultPath = [];
    for(var i = 0;i < finalPath.length;i++) {
      var arr = finalPath[i].split(" ");
      resultPath.push({
        lat: parseFloat(arr[0]),
        lng: parseFloat(arr[1])
      });
    }
    // console.log(resultPath);
    res.send(resultPath);
  });
});

app.post('/api/tour', function(req, res){
  console.log(req.body.data);
  // res.send("we will give final tour based on geolocation: " + JSON.stringify(req.body));
  var demoResult = [
                    [
                      { "lat": 12.920497899999999  , "lng": 77.68515250000001 },
                      { "lat":  12.92047908001919, "lng": 77.6851536333561},
                      { "lat":  12.920472544271435, "lng": 77.68517844378948},
                      { "lat":  12.920449015578107, "lng": 77.68517944961786}
                    ],
                    [
                      { "lat": 13.920497899999999  , "lng": 77.68515250000001 },
                      { "lat":  13.92047908001919, "lng": 77.6851536333561},
                      { "lat":  13.920472544271435, "lng": 77.68517844378948},
                      { "lat":  13.920449015578107, "lng": 77.68517944961786}
                    ]
                   ];
  res.send(demoResult);
});

app.get('/data/saveToFile', function(req, res) {
  Tour.find({}, saveData);

  function saveData(err, response) {
    if(err) {
      console.log(err);
      res.send(err);
    }
    else {
      var output = {
        "epsilon": 0.00016,
        "min_neighbors": 2,
        "min_num_trajectories_in_cluster": 3,
        "min_vertical_lines": 2,
        "min_prev_dist": 0.0002,
        // trajectories is a list of paths.
        "trajectories": []
      };

      // Convert path in db to object type - Object<x: lat, y:lng>
      for(var i = 0;i < response.length;i++) {
        var obj = response[i];
        var path = obj.path.map(function(item) {
          var ret = {
            x: item.lat,
            y: item.lng
          }
          return ret;
        });
        output.trajectories.push(path);
      }

      var fileOutput = JSON.stringify(output, null, 4);
      fs.writeFile("./data/algo_input.txt", fileOutput, function (err, response) {
        if(err) console.log(err);
      });
      res.send(fileOutput);
    }
  }
});

app.post('/api/getTours', function (req, res) {
  // Read trajectories from file.
  fs.readFile('./data/algo_output.txt', readData);

  function readData(err, data) {
    if(err) {
      console.log(err);
      res.send(err);
    }
    else {
      var data = JSON.parse(data);
      var trajectories = data.trajectories;
      var paths = [];
      for(var i = 0;i < trajectories.length;i++) {
        var path = trajectories[i].map(function (item) {
          return {
            lat: item.x,
            lng: item.y
          };
        });

        paths.push(path);
      }
      res.send(paths);
    }
  }

});

var httpsServer = https.createServer(credentials, app);

httpsServer.listen('6443', function(err){
  if(err)
    console.log(err);
  else
    console.log("Connected to port 6443.");
});
