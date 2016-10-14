#!/usr/bin/env node
/**
 * driver-philips-hue, 26.09.2016 Spaceify Oy
 *
 * @class PhilipsHueDriver
 */

var spaceify = require("/api/spaceifyapplication.js");

var HueBackend = require("./huebackend");

function PhilipsHueDriver()
{
var self = this;

var lightsServiceIds = {};
var lightsService = null;
var privateService = null;

var hueBackend = new HueBackend();


var driverState = {};


var refreshGateways = function(callback)
	{
	hueBackend.findHueGateways(function(err, gateways)
		{
		if (err)
			{
			console.log(err);	
			return;		
			}			
		
		if (gateways && gateways.length >0)
			{
			driveState = new Object();

			for (var i=0; i < gateways.length; i++ )
				{
				driverState[gateways[i].id] = {id: gateways[i].id, ip: gateways[i].internalipaddress, paired: true}; 				
				}	
			}

		callback();		
		});
	};


var recurseConnectToGateways = function(gatewayIndex, gatewayKeys, callback)
	{
	if (gatewayIndex >= gatewayKeys.length)
		{		
		callback();
		return;		
		}
	var i = gatewayKeys[gatewayIndex];	
	
	hueBackend.connectToGateway(driverState[i].ip, function(err, statusCode, data)
		{
		if (err)
			{				
			console.log(err);		
			//delete driverState[i]; 
			}

		else if (statusCode == 101)
			driverState[i].paired = false;
		
					
		
		recurseConnectToGateways(gatewayIndex+1, gatewayKeys, callback);		
		});	
	};



var connectToGateways = function(callback)
	{
	recurseConnectToGateways(0,Object.keys(driverState), callback);
	};	


var recurseGetReachableLights = function(gatewayIndex, gatewayKeys, callback)
	{
	if (gatewayIndex >= gatewayKeys.length)
		{		
		callback();
		return;		
		}

	var i = gatewayKeys[gatewayIndex];	
	
	if (driverState[i].paired)
		{
		hueBackend.getReachableLights(driverState[i].ip, function(err,data)
			{
			if (err)
				console.log(err);
			driverState[i].lights = data;
			recurseGetReachableLights(gatewayIndex+1, gatewayKeys, callback);				
			});
		}
	else
		recurseGetReachableLights(gatewayIndex+1, gatewayKeys, callback);	
	};


	
var getReachableLights = function(callback)
	{
	recurseGetReachableLights(0,Object.keys(driverState), function()
		{
		callback(driverState);
		});
	};


// Exposed RPC methods

self.getLights = function(callObj, callback)
	{
	refreshGateways(function()
		{
		connectToGateways(function()
			{
			getReachableLights(function(lights)
				{
				callback(null, lights);		
				});			
			});		
		});		
	};	



self.setLightState = function(gatewayId, lightId, state, callObj, callback)
	{
	console.log("PhilipsHueDriver::setLightState() "+ JSON.stringify(state));

	hueBackend.setLightState(driverState[gatewayId].ip, lightId, state, function(err,data)
		{
		callback(err, data);	
		});
	};	


	
// Implementation of the start() and fail() callbacks required by Spaceify

self.start = function()
	{
	lightsService = spaceify.getProvidedService("spaceify.org/services/lights");
	privateService = spaceify.getProvidedService("spaceify.org/services/lights/private/driver_philips_hue");

	lightsService.exposeRpcMethod("getLights", self, self.getLights);
	lightsService.exposeRpcMethod("setLightState", self, self.setLightState);

	privateService.exposeRpcMethod("getReachableLights", self, getReachableLights);
	};

self.fail = function(err)
	{	
	};

var stop = function()
	{
	spaceify.stop();
	};

}

var philipsHueDriver = new PhilipsHueDriver();

//philipsHueDriver.getLights(null, function(err,lights) {console.log("getLights palautti: " + JSON.stringify(lights));});
spaceify.start(philipsHueDriver, {webservers: {http: true, https: true}});
