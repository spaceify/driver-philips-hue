"use strict";

var request = null;

try
	{
	request = require("/api/node_modules/request");
	}
catch (e)
	{
	request = require("request");
	}

function HueBackend()
{
var self = this;

var MEETHUE_URL = "https://www.meethue.com/api/nupnp";

// This function uses https://www.meethue.com/api/nupnp
// for finding the Hue gameways in local network

var deviceType = "testdevice";
var userName = "newdeveloper3";

var gateways = null;

self.findHueGateways = function(callback)
	{
	
	request.get({url: MEETHUE_URL, json: true, headers: {'User-Agent': 'request'}}, function (err, res, data)
		{
    		if (err) 
			{
      			callback(err, null);
    			}
		
		else if (res.statusCode !== 200)
			{
			callback("Error, http server returned: "+res.statusCode, null);
    			} 
		else 
			{
      			// data is already parsed as JSON:
			gateways=data;			
			callback(null, data);  	    									
			}
		});

	};	

 var registerUser = function(gatewayIp, callback)
	{
	var url = "http://"+gatewayIp+"/api";
	var requestData = {devicetype: deviceType, username: userName};
	
	request({url: url, method: "POST", json: requestData}, function (err, res, data)
		{
    		if (err) 
			{
      			callback(err, null, null);
    			}
		
		else if (res.statusCode !== 200)
			{
			callback("Error, http server returned: "+res.statusCode, null, null);
    			} 
		else 
			{
      			// data is already parsed as JSON:		
			var statusCode = 200;

			if (data[0] && data[0].hasOwnProperty("error") && data[0].error.hasOwnProperty("type"))
				{
				statusCode = data[0].error.type;				
				}				
			callback(null, statusCode, data);  	    									
			}
		});
	};
self.connectToGateway = function(gatewayIp, callback)
	{
	self.getLights(gatewayIp, function(err, data)
		{
		if (data[0] && data[0].hasOwnProperty("error") && data[0].error.hasOwnProperty("type") && data[0].error.type==1)
			registerUser(gatewayIp, callback);		
		else
			callback(null, 200, data);		
		});
	
	

	
	
	};

self.getLights = function(gatewayIp, callback)
	{
	var url = "http://"+gatewayIp+"/api/"+userName+"/lights";

	request.get({url: url, json: true, headers: {'User-Agent': 'request'}}, function (err, res, data)
		{
    		if (err) 
			{
      			callback(err, null);
    			}
		
		else if (res.statusCode !== 200)
			{
			callback("Error, http server returned: "+res.statusCode, null);
    			} 
		else 
			{
      			// data is already parsed as JSON:
			gateways=data;			
			callback(null, data);  	    									
			}
		});	

	};


self.getReachableLights = function(gatewayIp, callback)
	{
	self.getLights(gatewayIp, function(err, data)
		{
		if (err)
			{
			callback(err,data);
			return;			
			}

		var ret = new Object();
		for (var i in data)
			{
			if (data[i].state.reachable)
				ret[i]= data[i];			
			}		
		callback(null,ret);			
		});
	};

self.setLightState = function(gatewayIp, lightId, state, callback)
	{
	var url = "http://"+gatewayIp+"/api/"+userName+"/lights"+"/"+lightId+"/state";	
	
	request({url: url, method: "PUT", json: state}, function (err, res, data)
		{
    		if (err) 
			{
      			callback(err, null);
    			}
		
		else if (res.statusCode !== 200)
			{
			callback("Error, http server returned: "+res.statusCode, null);
    			} 
		else 
			{
      			// data is already parsed as JSON:		
					
			callback(null, data);  	    									
			}
		});
	};
}

//test code
/*
var hueBackend = new HueBackend();
hueBackend.findHueGateways(function(err, gateways)
	{
	if (err)
		{
		console.log(err);	
		return;		
		}
		
	console.log("Found following local HUE gateways: "+ JSON.stringify(gateways));	
	hueBackend.connectToGateway(gateways[0].internalipaddress, function(err, statusCode, data)
		{
		if (err)
			{
			console.log(err);	
			return;		
			}
		console.log("HUE gateway replied when connecting: "+ JSON.stringify(data));
		
		if (statusCode==101)
			{
			console.log("Please press the button on HUE gateway and try again!");			
			return;			
			}

		hueBackend.getReachableLights(gateways[0].internalipaddress, function(err,data)
			{
			console.log("Following REACHABLE lights were found at the gateway: "+ JSON.stringify(data));
			
			for (var i in data)
				{
				hueBackend.setLightState(gateways[0].internalipaddress, i, {on: false}, function(err,data)
					{
					if (err)
						{
						console.log(err);	
						return;		
						}
					else
						console.log(data);						
					});
				setTimeout(function() 
					{
					hueBackend.setLightState(gateways[0].internalipaddress, i, {on: true}, function(err,data){}); 
					}, 1000);	
				}			
			
			});		
		});
	}); 

*/
module.exports = HueBackend;

