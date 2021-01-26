const Bus = require('../models/Test');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

exports.getTestData = (req, res) => {
	let data = [
		new Test('Test name', 12),
		new Test('Second name', 13)
	];
	res.render('testView', {
		data : data,
	});
};

exports.getSecondTestData = (req, res) => {
	let data = [
		new Test('other name', 15),
		new Test('other second name', 16)
	];
	res.render('testView', {
		data : data,
	});
};

exports.getBusData = (req, res) => {
    busBoard(req.params.postcode, res);
};

/*-------------------------------------------------------------------------------------------------------------------------------------
// our logic from our busboard app is below
-------------------------------------------------------------------------------------------------------------------------------------*/

busBoard = function(postcode, res) {
    checkPostcodeValid(postcode);
    getLatLong(postcode, res);
};

checkPostcodeValid = function(postcode) {
    // const postcodeExpr = /^([A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]|[A-HK-Y][0-9]([0-9]|[ABEHMNPRV-Y]))|[0-9][A-HJKS-UW])\ [0-9][ABD-HJLNP-UW-Z]{2}|(GIR\ 0AA)|(SAN\ TA1)|(BFPO\ (C\/O\ )?[0-9]{1,4})|((ASCN|BBND|[BFS]IQQ|PCRN|STHL|TDCU|TKCA)\ 1ZZ))$/i;
    // if (!postcodeExpr.test(postcode)) {
    //     throw 'Invalid postcode format';
    // } else {
        var validRequest = new XMLHttpRequest();
        var validUrl = `http://api.postcodes.io/postcodes/${postcode}/validate`;
        validRequest.open('GET', validUrl, true);
        validRequest.onload = function () {
            var response = JSON.parse(validRequest.responseText);
            var result = response.result;
            
            if (!result) {
                throw 'Invalid postcode';
            } 
        }
        validRequest.send();
    // }
};

getLatLong = function(postcode, res) {
    var postcodeRequest = new XMLHttpRequest();
    var postcodeUrl = `http://api.postcodes.io/postcodes/${postcode}`

    // use api.postcodes.io to get latitude and longitude
    postcodeRequest.open('GET', postcodeUrl, true);
    postcodeRequest.onload = function () {
        const postcodeResponse = JSON.parse(postcodeRequest.responseText);
        const location = {'postcodeLat': postcodeResponse.result.latitude, 'postcodeLong': postcodeResponse.result.longitude};
        // const location = extractLatLong(postcodeResponse);

        // use transport api to look up 2 nearest bus stops
        findNearestStops(location, 2, res);
    }

    postcodeRequest.send();
};

findNearestStops = function(location, num, res) {
    var busStopUrl = `http://transportapi.com/v3/uk/places.json?lat=${location.postcodeLat}&lon=${location.postcodeLong}&type=bus_stop&app_id=97d91d05&app_key=b77e693ec08272f32658588da099e89f`;
    var stopRequest = new XMLHttpRequest();    
    stopRequest.open('GET', busStopUrl, true);
    stopRequest.onload = function () {
        var response = JSON.parse(stopRequest.responseText);

        // extract bus stop codes of 2 nearest bus stops
        stops = [];
        for (let i = 0; i < num; i++) {
            stops.push(response.member[i].atcocode);        
        }

        // print departure board for each bus stop
        findBusesForStop1(stops, res);
    }
    stopRequest.send();
};

findBusesForStop1 = function(stops, res) {
    var request = new XMLHttpRequest();
    var url = `http://transportapi.com/v3/uk/bus/stop/${stops[0]}/live.json?group=route&app_id=97d91d05&app_key=b77e693ec08272f32658588da099e89f`;

    request.open('GET', url, true)
    var response;

    request.onload = function () {
        // store all the requested data
        response = JSON.parse(request.responseText);

        // Extract the information on bus departures
        departures = response.departures;
    
        stop1Buses = findSoonest5Buses(departures); 
        findBusesForStop2(stops[1], stop1Buses, res);
    }

    request.send();
}

findBusesForStop2 = function(stop2, stop1Buses, res) {
    var request = new XMLHttpRequest();
    var url = `http://transportapi.com/v3/uk/bus/stop/${stop2}/live.json?group=route&app_id=97d91d05&app_key=b77e693ec08272f32658588da099e89f`;

    request.open('GET', url, true)
    var response;

    request.onload = function () {
        // store all the requested data
        response = JSON.parse(request.responseText);

        // Extract the information on bus departures
        departures = response.departures;

        var allBuses = stop1Buses.concat(findSoonest5Buses(departures));

        res.render('testView', {
            data: allBuses,
        })
    }

    request.send();
}

findSoonest5Buses = function(departures) {
    var departureBoard = [];

    for (let busRoute in departures) {        
        departureBoard = departureBoard.concat(departures[busRoute].map(departure => {
            var bus = new Bus(departure.line, departure.aimed_departure_time, departure.expected_departure_time, departure.direction);
            return bus;
        }));
    }       

    departureBoard.sort(function(a, b) {
        if (a.expected_departure_time < b.expected_departure_time) {
            return -1;
        } else if (a.expected_departure_time > b.expected_departure_time) {
            return 1;
        } else { 
            if (a.aimed_departure_time < b.aimed_departure_time) {
                return -1;
            } else if (a.aimed_departure_time > b.aimed_departure_time) {
                return 1;
            } else {
                return 0;  
            }          
        }
    })

    if (departureBoard.length >= 5) {
        return departureBoard.slice(0,5);
    } else {
        return departureBoard.slice(0,departureBoard.length)
    }
}



// printNearestStops = function(stops) {
//     let arr = [];
//     stops.forEach(stop => {
//         arr.concat(printDepartureBoard(stop));
//     });
//     return arr;
// };

// printDepartureBoard = function(atcocode) {
//     var request = new XMLHttpRequest();
//     var url = `http://transportapi.com/v3/uk/bus/stop/${atcocode}/live.json?group=route&app_id=97d91d05&app_key=b77e693ec08272f32658588da099e89f`;

//     request.open('GET', url, true)
//     var response;

//     request.onload = function () {
//         // store all the requested data
//         response = JSON.parse(request.responseText);

//         // Extract the information on bus departures
//         departures = response.departures;
    
//         var departureBoard = [];

//         for (let busRoute in departures) {
//             departureBoard = departureBoard.concat(Object.values(departures[busRoute]));
//         }       

//         departureBoard.sort(function(a, b) {
//             if (a.expected_departure_time < b.expected_departure_time) {
//                 return -1;
//             } else if (a.expected_departure_time > b.expected_departure_time) {
//                 return 1;
//             } else { 
//                 if (a.aimed_departure_time < b.aimed_departure_time) {
//                     return -1;
//                 } else if (a.aimed_departure_time > b.aimed_departure_time) {
//                     return 1;
//                 } else {
//                     return 0;  
//                 }          
//             }
//         })

//         return departureBoard;

//         // console.log(response.name);
//         // if (departureBoard.length == 0) {
//         //     console.log('No upcoming departures');
//         // } else {
//         //     let i = 0;
//         //     while (i < departureBoard.length && i < 5) {
//         //         printDepartureInfo(departureBoard[i]);
//         //         i++;
//         //     }
//         // }
//         // let i = 0;
//         // while (i < departureBoard.length && i < 5) {
//         //     printDepartureBoard([i]);
//         //     i++;
//         // }

//      }

//     request.send();
// }

// // function printDepartureInfo(departure) {
// //     let arr = [`Route: ${departure.line}`, `Scheduled: ${departure.aimed_departure_time}`, `Expected: ${departure.expected_departure_time}  `, `Direction: ${departure.direction}`];
// //     console.log(arr.join('\t'));
// // }


