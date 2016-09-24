exports.log_mode = {
	info: 1,
	debug: 2,
	verbose: 3
};

var loger = function (msg) {
	if (msg && msg.toString) {
		var s = msg.toString();
		if (s.indexOf("[object ") >= 0) {
			s = JSON.stringify(msg);
		}
		post(s);
	} else if (msg === null) {
		post("<null>");
	} else {
		post(msg);
	}
};

exports.log = {
	info: function () {
		if (verbosity >= exports.log_mode.info) {
			loger("   [INFO] ");
			for (var i in arguments) {
				loger(arguments[i]);
			}
			post('\n');
		}
	},
	debug: function () {
		if (verbosity >= exports.log_mode.debug) {
			loger("  [DEBUG] ");
			for (var i in arguments) {
				loger(arguments[i]);
			}
			post('\n');
		}
	},
	verbose: function () {
		if (verbosity >= exports.log_mode.verbose) {
			loger("[VERBOSE] ");
			for (var i in arguments) {
				loger(arguments[i]);
			}
			post('\n');
		}
	}
};