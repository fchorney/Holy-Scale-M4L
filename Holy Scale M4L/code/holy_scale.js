// Inlets/Outlets
inlets = 1;
outlets = 4;

// Variables
var key_selectors = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
var chords = {};
var valid_keys = [];
var key_names = [];
var selected_mode = "major";

// Key state management
var keys_on = {};
var input_keys = {};

var play_chord = function (key_letter, midi_note, velocity) {
	
	var offsets = chords[key_letter][key_selectors[key_letter]];

	// Loop through the offsets and go through
	// the chord logic
	for (var i in offsets) {
		var play_note = midi_note + offsets[i];
		var key = play_note;
		var in_keys_on = (key in keys_on);

		// If this is a note on message...
		if (velocity != 0) {
			// Send a note off before the note on,
			// if the note is currently already on
			if (in_keys_on) {
				note_off(play_note);
			}

			// Send a note on
			note_on(play_note, velocity);

			// Deal with key state by adding the key
			// to the state tracker, or incrementing
			// its count
			if (!in_keys_on) {
				keys_on[key] = 1;
			} else {
				keys_on[key] += 1;
			}
		} else { // This is a note off message (velocity = 0)
			if (in_keys_on) {
				// If the key is still "on" decrement it
				// from the keys_on dict.
				keys_on[key] -= 1;
			}
		}

		// If the key is in keys_on and is set to 0
		// then send  note_off message for it and
		// delete it from the keys_on dict
		if (in_keys_on && keys_on[key] == 0) {
			note_off(play_note);
			delete keys_on[key];
		}
	}
};

/* Accept a note in trigger.
 * Will trigger when a midi note is played
 */
var notein = function (midi_note, velocity) {
	log.debug("notein ", midi_note, ' ', velocity);

	// Keep a state of which keys are currently being held down
	if (velocity != 0) {
		input_keys[midi_note] = true;
	} else {
		delete input_keys[midi_note];
	}

	// Determine the chord to play and play it
	var key_letter = get_key_letter(midi_note);
	if (contains(valid_keys, key_letter)) {
		var key_index = valid_keys.indexOf(key_letter);
		play_chord(key_index, midi_note, velocity);
		led_out(key_index, velocity);
	}

	// Clean up the stuck keys if we need to
	clean_up_keys();
};

/* Accept a note mod trigger
 * Will trigger when one of
 * the note knobs is changed
 * or when a midi note is played
 */
var notemod = function () {
	var item, letter, value, i;
	for (i in arguments) {
		if (arguments[i] != 0) {
			item = arguments[i].split('-');
			letter = item[0];
			value = item[1];
		
			key_selectors[letter] = value;
		}
	}

	// Clean up the stuck keys if we need to
	clean_up_keys();

	log.debug("notemod ", key_selectors);
};

/* Accept a key mod trigger
 * Will trigger when the key knob is changed
 */
var keymod = function (key) {
	log.info("keymod ", key);
	valid_keys = chord_module.key_signatures[selected_mode][key];
	key_names = chord_module.key_names[selected_mode][key];
	
	for (var i in key_names) {
		outlet(3, i, key_names[i]);
	}
};

/* Set the loglevel of the script
 * for debugging
 */
var loglevel = function (log_level) {
	log.info("loglevel ", log_level);
	verbosity = log_level;
};

/* Return the key letter
 * for the key that the midi note represents
 */
var get_key_letter = function (midi_note) {
	var all_keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	return all_keys[midi_note % 12];
};

/* Output the led value for
 * the note played
 */
var led_out = function (key_index, velocity) {
	log.verbose("LED Out ", key_index, " ", velocity);
	outlet(1, [key_index, velocity]);
};

/* Send a note on message to the outlet,
 * using the midi key value and velocity
 */
var note_on = function (key_value, velocity) {
	log.verbose("Note On ", key_value, " ", velocity);
	outlet(0, [key_value, velocity]);
};

/* Send a note off message to the outlet,
 * using the midi key value and implicit velocity 0
 */
var note_off = function (key_value) {
	log.verbose("Note Off ", key_value);
	outlet(0, [key_value, 0]);
};

/* Clean Up Keys
 * If we have any chord keys stuck and
 * no keys are currently being held down
 * then send note off's for all the stuck keys
 * and clean up the key state variables
 */
var clean_up_keys = function () {
	log.verbose("Clean Up Keys");
	// If we have no active notein keys, but we have some stuck chord keys...
	if (obj_length(input_keys) == 0 && obj_length(keys_on) > 0) {
		// Send note offs for each stuck note
		var del = [];
		for (var note_value in keys_on) {
			// Send a note_off
			var note_int = parseInt(note_value, 10);
			note_off(note_int);

			// Save the key to delete outside of this loop
			del.push(note_value);
		}

		// Delete any values from keys_on
		for (var i in del) {
			delete keys_on[del[i]];
		}
	}
};

/* Take in any object/dictionary
 * and return the number of keys it
 * posesses
 */
var obj_length = function (obj) {
	return Object.keys(obj).length;
};

/* Take in an array and a value
 * and return whether the value
 * exists in the array or not
 */
var contains = function (a, val) {
	return a.indexOf(val) != -1;
};

// Require the js utilities
var utils_module = require('require-utils');
var verbosity = utils_module.log_mode.debug;
var log = utils_module.log;

// Show where we reloaded the script in the log
var reload = "Reload: " + new Date;
var underscore = "";
for (var i = 0; i < reload.length; i++) {
	underscore += '_';
};
log.info(underscore);
log.info(reload);

// Require the chords
var chord_module = require("require-chords");
chords = chord_module.chords;
selected_mode = jsarguments[1];

// When script is reloaded, send out a bang to re-load the key selectors and chords
outlet(2, "bang");