var Comms = (function() {
	var self = {};
	var sock = new WebSocket('wss://wss.redditmedia.com/thebutton?h=499ae8c8a57596392baa463ca85c2590b2846fb1&e=1428606270');
	sock.onmessage = tick;
	var graph_limit = 1000;

	function tick(evt) {
		// {"type": "ticking", "payload": {"participants_text": "585,177", "tick_mac": "362a88a8ae0a89c909395f587e329992c656b4d8", "seconds_left": 59.0, "now_str": "2015-04-04-23-44-42"}}
		var packet = JSON.parse(evt.data);
		if (packet.type != "ticking") {
			return;
		}

		packet.payload.now = moment(packet.payload.now_str + " 0000", "YYYY-MM-DD-HH-mm-ss Z");
		Stats.lag = d3.format("0,000")(packet.payload.now - moment());

		if (data.length > 0 && packet.payload.seconds_left >= _.last(data).seconds_left) {
			_.last(data).is_click = true;
			data = scrub_data(data);
		}
		data.push(packet.payload);
		$('#resets').text(fmt(clicks.length));
		Stats.ticks += 1;
		Stats.participants = packet.payload.participants_text;

		Chart.render(data);
		Timer.sync(packet.payload.seconds_left);
		Stats.render();
	}

	// Remove any non-click elements in data; if number of clicks is over the
	// limit, cut it in half by averaging every other point.
	function scrub_data(data) {
		var clicks_only = [];
		// Only keep click events
		for(var i = 0; i < data.length; i++) {
			var event = data[i];
			if(event.is_click == true) {
				clicks_only.push(event);
			}
		}

		// average every-other click time
		var compressed_data = [];
		if(clicks_only.length >= graph_limit) {
			console.log('Graph larger than ' + graph_limit + ', compressing.');
			var averaging_chamber = [];
			for(var i = 0; i < clicks_only.length; i++) {
				var event = clicks_only[i];
				averaging_chamber.push(event);
				if(averaging_chamber.length >= 2) {
						average_seconds = (averaging_chamber[0].seconds_left + averaging_chamber[1].seconds_left)/2;
						averaging_chamber[0].seconds_left = average_seconds;
						compressed_data.push(averaging_chamber[0]);
						averaging_chamber = [];
				}
			}
			return(compressed_data);
		} else {
			return(clicks_only);
		}
	}
	return self;
}())
