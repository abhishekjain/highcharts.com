/**
 * The EventMonitor class is a helper class that verifies arguments used
 * in event methods. It also keeps count of adds and removes to help
 * avoid memory leaks.
 */
function EventMonitor(add, remove, fire) {
	this.internalAdd = add;
	this.internalRemove = remove;
	this.internalFire = fire;

	this.reset();
}

/**
 * Returns the id to use for the next object.
 */
EventMonitor.prototype.getId = function() {
	return this.nextId++;
};

/**
 * Registers an event with the monitor.
 */
EventMonitor.prototype.registerEvent = function(el, eventName, handler) {
	// Sanity checks
	var HTMLEvents = /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
		MouseEvents = /^(?:click|mouse(?:down|up|over|move|out))$/,
		eventType = 'CustomEvents';

	if (HTMLEvents.test(eventName)) { eventType = 'HTMLEvents' };
	if (MouseEvents.test(eventName)) { eventType = 'MouseEvents' };

	if (eventType === 'HTMLEvents' || eventType === 'MouseEvents') {
		if (!el.nodeType) {// && el != window) {
			jstestdriver.console.log('HTMLEvents and MouseEvents are only allowed on DOM elements: ' + eventName);
		}
	}

	// 1. Create an id so to not have a reference to the object
	// 2. Store the id in our registry and in the object
	// 3. Add a mapping from the id to the event name and a counter instead of the function
	var id;

	if (el['evt-id'] !== undefined) {
		id = el['evt-id'];
	} else {
		el['evt-id'] = id = this.getId();
	}

	// Create registry item if its not there
	if (!this.registry[id]) {
		this.registry[id] = {};
	}

	var eventObject = this.registry[id];

	// Create an eventname that is the combination of event and function
	eventKey = this.getHandlerKey(eventName, handler);

	// Create event counter if its not there
	if (!eventObject[eventKey]) {
		eventObject[eventKey] = 0;
	}

	// Add one for the new event
	eventObject[eventKey] = eventObject[eventKey] + 1;
};

/**
 * Creates a string key from a handler function.
 */
EventMonitor.prototype.getHandlerKey = function(eventName, handler) {
	var s = handler.toString();
	s = s.split(' ').join('');
	s = s.split('\r').join('');
	s = s.split('\n').join('');
	return eventName + '_' + s;
};

/**
 * Registers an event to the monitor.
 */
EventMonitor.prototype.unregisterEvent = function(el, eventName, handler) {
	var id = el['evt-id'];
	if (id === undefined) {
		jstestdriver.console.log('Trying to unregister an event (' + eventName + ') on an object thats not registered yet.');
	}

	var eventObject = this.registry[id];

	if (eventName) {
		if (handler) {
			// Create an eventname that is the combination of event and function
			eventKey = this.getHandlerKey(eventName, handler);

			// Remove one event handler
			eventObject[eventKey] = eventObject[eventKey] - 1;

			// If the counter reach zero, remove the event name
			if (eventObject[eventKey] === 0) {
				delete eventObject[eventKey];
			}
		} else {
			// Remove all events starting with eventName + '_'
			for (var name in eventObject) {
				var eventKey = eventName + '_';
				if (name.substring(0, eventKey.length) === eventKey) {
					delete eventObject[name];
				}
			}
		}

		// If there are no more event names, remove the object as well as the
		// id in the tracked object
		var numberOfEventNames = 0;
		for (var p in eventObject) {
			numberOfEventNames++;
		}

		if (numberOfEventNames === 0) {
			delete this.registry[id];
			delete el['evt-id'];
		}
	} else {
		// Remove all handlers
		delete this.registry[id];
		delete el['evt-id'];
	}
};

/**
 * Logs currently monitored events to the console.
 */
EventMonitor.prototype.log = function() {
	var writeHeader = true;
	for (var name in this.registry) {
		if (writeHeader) {
			jstestdriver.console.log('');
			jstestdriver.console.log('----- registered events -----');
			writeHeader = false;
		}
		jstestdriver.console.log('object: ' + name);
		var eventObject = this.registry[name];

		for (var eventName in eventObject) {
			jstestdriver.console.log('  ' + eventName.split('_')[0] + ' has ' + eventObject[eventName] + ' number of handlers registered');
		}
	}
};

/**
 * Resets the id counter and clears the registry.
 */
EventMonitor.prototype.reset = function() {
	this.registry = {};
	this.nextId = 0;
};

// Map the three event functions to call our own instead.
var eventMonitor = new EventMonitor(addEvent, removeEvent, fireEvent);

/**
 * Add an event listener
 * @param {Object} el A HTML element or custom object
 * @param {String} eventName The event name
 * @param {Function} handler The event handler
 */
addEvent = function(el, eventName, handler) {
	eventMonitor.registerEvent(el, eventName, handler);
	eventMonitor.internalAdd(el, eventName, handler);
};

/**
 * Remove event added with addEvent
 * @param {Object} el The object
 * @param {String} eventName The event name. Leave blank to remove all events.
 * @param {Function} handler The function to remove. Leave blank to remove all of above type.
 */
removeEvent = function(el, eventName, handler) {
	eventMonitor.unregisterEvent(el, eventName, handler);
	eventMonitor.internalRemove(el, eventName, handler);
};

/**
 * Fire an event on a custom object
 * @param {Object} el The object
 * @param {String} eventName The event name.
 * @param {Object} eventArguments
 * @param {Function} defaultFunction
 */
fireEvent = function(el, eventName, eventArguments, defaultFunction) {
	eventMonitor.internalFire(el, eventName, eventArguments, defaultFunction);
};
