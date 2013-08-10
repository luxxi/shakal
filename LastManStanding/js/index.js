
var serviceUrl = "http://im.scv.si/rtc/lazer/service.php";

var GET_GPS_MILISECONDS = 15000;//300000;
var METERS_HIT = 50;
var SECONDS_BEFORE_START = 5;
var dead = false;

/*Glej Klemen tudi tukaj obstajajo komentarji ;)*/
/* Aja tako se jih dela.. js sem pa skoz <!-- --> poskušal pa ni šlo :) */
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    if (window.location.pathname.substr(-10) == "index.html") {
        console.log(localStorage.Username);
        if (localStorage.Username != null) {
            $.post(serviceUrl, {
                act: "get_current_user",
                username: localStorage.Username
            }, function(d) {
                if (d != "error") {
                    localStorage.User = d;
                    d = JSON.parse(d);
                    if (d["tournament"] == false) {
                        window.location.href = "tournaments.html";
                    }
                    else if (d["tournament"]["status_id"] == 1) {
                        window.location.href = "tournament.html?tournament=" + d["tournament"]["name"];
                    }
                    else {
                        if (d["killed"] == true) {
                            window.location.href = "game.html?killed=" + d["killed_by"];
                        }
                        else {
                            window.location.href = "game.html";
                        }
                    }
                    //d = JSON.parse(d);
                }
            });
        }
    }
    
    //
	
    FastClick.attach(document.body);
    
    var timer = self.setInterval(SaveLoggedUserLocation, GET_GPS_MILISECONDS);
    $(document).ready(function() {
        $("#loginBtn").click(function() {
            var username = $("#username").val();
            var pass = $("#pass").val();
            Login(username, pass);
        }) 
    });
    
    $(document).ready(function() {
        $("#createBtnHref").click(function() {
            window.location.href = "create.html"; 
        });
    });
    
    $(document).ready(function() {
        $("#createTournamentBtn").click(function() {
            var tournamentName = $("#tournamentName").val();
            var numOfPlayers = $("#numOfPlayers").val();
            var tournamentPass = $("#tournamentPass").val();
            var tournamentDate = $("#tournamentDate").val();
            var tournamentTime = $("#tournamentTime").val();
           
            $.post(serviceUrl, {
                act: "create_tournament",
                name: tournamentName,
                number: numOfPlayers,
                password: tournamentPass,
                timeframe: tournamentDate + " " + tournamentTime,
                username: localStorage.Username
            }, function(d) {
                window.location.href = "tournament.html?tournament=" + tournamentName;
            });
        });
    });
    
    $(document).ready(function() {
        $("#registerUser").click(function() {
            var userMail = $("#userMail").val();
            var userPass = $("#userPass").val();
            var userPass2 = $("#userPass2").val();
            var userName = $("#userName").val();
           
            $.post(serviceUrl, {
                act: "register_user",
                email: userMail,
                password: userPass,
                password2: userPass2,
                sex: "M",
                name: userName
            }, function(d) {
                //alert(d);
            });
        });
    });
    
    $(document).ready(function() {
        $("#refreshBtn").click(function() {
            var tournament = $("#tournament_name").html();
            RefreshTournament(tournament);
        }); 
    });
    
    $(document).ready(function() {
        $("#logoutBtn").click(function() {
            LogoutFromApp();
        }) 
    });
    
    $(document).ready(function() {
        $("#tournamentLogoutBtn").click(function() {
            var username = localStorage.Username;
            var tournamentName = $("#tournament_name").val();
            LogoutOfTournament(username, tournamentName); 
        });
    });
    
    $(document).ready(function() {
        $("#refreshTournamentsBtn").click(function() {
            $("#tournaments").html("");
            GetTournaments();
        });
    });
    
    $(document).ready(function() {
        $.ajaxSetup({async:true});
        $("#targetAboutBtn").click(function() {
            $("#neki").addClass("fade");
            SetGame();
            OpenDialog("targetAboutDiv");
        });
        $("#targetLocationBtn").click(function() {
            $("#neki").addClass("fade");
            SetGame();
            OpenDialog("targetLocationDiv"); 
        });
        $("#userAboutBtn").click(function() {
            $("#neki").addClass("fade");
            SetGame();
            OpenDialog("userAboutDiv"); 
        });
        $("#userLocationBtn").click(function() {
            $("#neki").addClass("fade");
            SetGame();
            OpenDialog("userLocationDiv");
        });
    });

    $(document).ready(function() {
        $("#hitBtn").click(function() {
            if (!dead) {
                navigator.notification.vibrate(500);
                navigator.geolocation.getCurrentPosition(function(position) {
                    var x = position.coords.latitude;
                    var y = position.coords.longitude;
                    $.post(serviceUrl, {
                        act: "hit",
                        username: localStorage.Username,
                        x: x,
                        y: y
                    }, function(d) {
                        try {
                            d = JSON.parse(d);
                            if (d["kill"] == true) {
                                $("#targetDown").dialog();
                                SetGame();
                            }
                            else {
                                alert("You missed for " + d['distance'] + " meters");
                            }
                        }
                        catch (e) {
                            alert("You have to wait " + d + " seconds to make next shot");
                        }
                    });
                })
            }
            else {
                alert("You can't shot while you are dead");
            }
        }); 
    });
}

function KillTarget(username) {
    $.post(serviceUrl, {
        act: "kill_target",
        username: username
    }, function(d) {
        SetGame();
        if (d == "won") {
            $("#wonDiv").dialog();
        }
    });
}

function CompareLocations(hunterX, hunterY, targetX, targetY, meters) {
    var R = 6371; // km
    var dLat = (targetX - hunterX).toRad();
    var dLon = (targetY - hunterY).toRad();
    var lat1 = parseFloat(hunterY).toRad();
    var lat2 = parseFloat(targetY).toRad();
    
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    var d = R * c;
    
    return d * 1000;
    alert(d * 1000 + " meters");
}

if (typeof Number.prototype.toRad == 'undefined') {
    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
}

function OpenDialog(id) {
    $("#fadeDiv").addClass("fade");
    $("#" + id).dialog({
        beforeClose: function(event, ui) {
            $("#fadeDiv").removeClass("fade");
        }
    });
}

function Login(username, pass) {
    $.post(serviceUrl, {
        act: "login",
        username: username,
        pass: pass
    }, function(d) {
        if (d != "error") {
            localStorage.User = d;
            localStorage.Username = username;
            d = JSON.parse(d);
            if (d["tournament"] == false) {
                window.location.href = "tournaments.html";
            }
            else if (d["tournament"]["status_id"] == 1) {
                window.location.href = "tournament.html?tournament=" + d["tournament"]["name"];
            }
            else {
                if (d["killed"] == true) {
                    window.location.href = "game.html?killed=" + d["killed_by"];
                }
                else {
                    window.location.href = "game.html";
                }
            }
            //d = JSON.parse(d);
        }
    });
}

function AddUserInTournament(username, tournament) {
    $.post(serviceUrl, {
        act: "add_user_in_tournament",
        username: username,
        tournament: tournament
    }, function(d) {
    });
}

function GetTournaments() {
    $.post(serviceUrl, {
        act: "get_tournaments"
    }, function(d) {
        d = JSON.parse(d);
        for (var i = 0; i < d.length; i++) {
            if (d[i]["pass"] == "") {
                $("#tournaments").append("<li onclick=\"Join(this, true)\"><div class='num'>1</div><div class='tournament'><p class='name'>" + d[i]["name"] + "<br /><span class='player'>" + d[i]["count"] + "/" + d[i]["max_users"] + " Players</span></p></div></li>");
            }
            else {
                $("#tournaments").append("<li onclick=\"Join(this, false, '" + d[i]["pass"] + "')\"><div class='num'>1</div><div class='tournament'></p><p class='player'>" + d[i]["name"] + "<br /><span class='player'>" + d[i]["count"] + "/" + d[i]["max_users"] + " Players</span></p></div></li>");
            }
        }
    });
}

function Join(ele, allowed, pas) {
    $.ajaxSetup({async:false});
    if (allowed) {
        var tour = ele.children[1].children[0].innerHTML.split("<br>")[0];
        AddUserInTournament(localStorage.Username, tour);
        window.location.href = "tournament.html?tournament=" + tour;
    }
    else {
        var tour = ele.children[1].children[0].innerHTML.split("<br>")[0];
        var pass = window.prompt(tour, "Please enter tournament password");
        //$("#passwordDiv").dialog();
        if (pass == pas) {
            AddUserInTournament(localStorage.Username, tour);
            window.location.href = "tournament.html?tournament=" + tour;
        }
        else {
            alert("Wrong password");
        }
    }
}

function GetTournamentInfo() {
    var tournament = getParameterByName("tournament");
    
    $.post(serviceUrl, {
        act: "get_tournament_info",
        tournament: tournament
    }, function(d) {
        d = JSON.parse(d);
        
        $("#tournament_name").html(d["name"]);
        $("#tournament_starts").html("Tournament starts: " + d["start"]);
        $("#tournament_num").html(d["count"] + " / " + d["max_users"]);
        for (var i = 0; i < d["users"].length; i++) {
            $("#tournament_users").append("<li>" + d["users"][i]["email"] + "</li>");
        }
        /* Začne turnir če je dovolj ljudi v njem
        if (d["count"] >= d["max_users"]) {
        $.post(serviceUrl, {
        act: "start_tournament",
        tournament: d["name"]
        }, function(d) {
        });
        // Odštevanje do začetka turnirja
        StartTimer($("#timer"), SECONDS_BEFORE_START, function() {
        window.location.href = "game.html"
        });
        }
        */
        //alert(d);
    });
}

function StartTimer(ele, secs, action) {
    var counter = setInterval(function() {
        StartTimer(ele, --secs, action);
    }, 1000);
    ele.html("Game starts in " + secs + " seconds");
    if (parseInt(secs) <= 0) {
        clearInterval(counter);
        action();
    }
}

function RefreshTournament(tournament) {
    $.post(serviceUrl, {
        act: "get_tournament_info",
        tournament: tournament
    }, function(d) {
        d = JSON.parse(d);
        if(d["status_id"] == "2"){
            window.location.href = "game.html";
        }
        $("#tournament_name").html(d["name"]);
        $("#tournament_num").html(d["count"] + " / " + d["max_users"]);
        $("#tournament_users").html("");
        for (var i = 0; i < d["users"].length; i++) {
            $("#tournament_users").append("<li>" + d["users"][i]["email"] + "</li>");
        }
        /*
        // Začne turnir če je dovolj ljudi v turnirju
        if (d["count"] >= d["max_users"]) {
        $.post(serviceUrl, {
        act: "start_tournament",
        tournament: d["name"]
        }, function(d) {
        });
        // Odštevanje do začetka turnirja
        StartTimer($("#timer"), SECONDS_BEFORE_START, function() {
        window.location.href = "game.html"
        }); 
        }
        */
    });
}

function Logout() {
    $.ajaxSetup({async:false});
    LogoutOfTournament(localStorage.Username);
    localStorage.clear();
    window.location.href = "index.html";
}

function LogoutFromApp() {
    localStorage.clear();
    window.location.href = "index.html";
}

function LogoutOfTournament(user) {
    $.post(serviceUrl, {
        act: "logout_of_tournament",
        username: user
    }, function(d) {
        window.location.href = "tournaments.html";
    });
}

function GetUserLocation(username) {
    $.post(serviceUrl, {
        act: "get_user_location",
        username: username
    }, function(d) {
        d = JSON.parse(d);
        $("#user_name").html(d["name"]);
        $("#user_description").html(d["description"]);
        var latlng = new google.maps.LatLng(d["statistics"]["geo_x"], d["statistics"]["geo_y"]);
        var googleApis_map_Url = 'http://maps.googleapis.com/maps/api/staticmap?size=300x300&maptype=hybrid&zoom=16&sensor=true&markers=size:mid%7Ccolor:red%7C' + latlng;
        var mapImg = '<img src="' + googleApis_map_Url + '" />';
        $("#userLocationDiv").html("<p>" + d["statistics"]["timeframe"] + "</p>" + mapImg);
    });
}

function GetUsersTargetLocation(username) {
    $.post(serviceUrl, {
        act: "get_users_target_location",
        username: username
    }, function(d) {
        d = JSON.parse(d);
        $("#target_name").html(d["name"]);
        $("#target_description").html(d["description"]);
        var latlng = new google.maps.LatLng(d["statistics"]["geo_x"], d["statistics"]["geo_y"]);
        var googleApis_map_Url = 'http://maps.googleapis.com/maps/api/staticmap?size=300x300&maptype=hybrid&zoom=16&sensor=true&markers=size:mid%7Ccolor:red%7C' + latlng;
        var mapImg = '<img src="' + googleApis_map_Url + '" />';
        $("#targetLocationDiv").html("<p>" + d["statistics"]["timeframe"] + "</p>" + mapImg);
    });
}

function SaveLoggedUserLocation() {
    var options = { maximumAge: 0, timeout: 10000, enableHighAccuracy: true };
    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, options);
}

function SetGame() {
    if (getParameterByName("killed") != "") {
        dead = true;
        $("#killedBy").html("<p>You were killed by " + getParameterByName("killed") + ".</p>");
        $("#killedBy").dialog();
    }
    GetUserLocation(localStorage.Username);
    GetUsersTargetLocation(localStorage.Username);
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var onGpsSuccess = function(position) {
    /*
    alert('Latitude: '    + position.coords.latitude          + '\n' +
    'Longitude: '         + position.coords.longitude         + '\n' +
    'Altitude: '          + position.coords.altitude          + '\n' +
    'Accuracy: '          + position.coords.accuracy          + '\n' +
    'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
    'Heading: '           + position.coords.heading           + '\n' +
    'Speed: '             + position.coords.speed             + '\n' +
    'Timestamp: '         + position.timestamp                + '\n');
    */
    $.post(serviceUrl, {
        act: "add_user_location",
        username: localStorage.Username,
        x: position.coords.latitude,
        y: position.coords.longitude
    }, function(d) {
        if (d != "ok") {
            d = JSON.parse(d);
            dead = true;
            $("#killedBy").html("<p>You were killed by " + d["killed_by"] + ".</p>");
            $("#killedBy").dialog({
                beforeClose: function() {
                    window.location.href = "tournaments.html";
                }
            });
        }
    });
};

// onError Callback receives a PositionError object
//
function onGpsError(error) {
    alert('code: ' + error.code + '\n' +
          'message: ' + error.message + '\n');
}
