const CalendarAPI = require('node-google-calendar');

const KEY = require('../../googleapi-key.json').private_key;
const SERVICE_ACCT_ID = require('../../googleapi-key.json').client_email;

const CONFIG = {
	key: KEY,
	serviceAcctId: SERVICE_ACCT_ID,
	calendarId: process.env.CALENDAR_ID, // ID da agenda
	timezone: process.env.TIMEZONE, // sp: UTC+02:00
	calendarUrl: process.env.CALENDAR_URL, // ical format (use the secret ical to avoid turning the calendar public)
};

const calendar = new CalendarAPI(CONFIG);
const { calendarId } = CONFIG;

module.exports.calendarMain = calendar;
module.exports.calendarId = calendarId; // the id of the requested calendar

// don't forget to get the googleapi-key.json from the project Console and add it to gitIgnore.
// you can also get the values from the json and add then to the .env file

// helper functions

// Gets every event EXCEPT events with Fechado in the name.
// "Fechada" -> hospital is not open
async function getAllEvents(param = {}) {
	const result = await calendar.Events.list(calendarId, param)
		.then((allEvents) => {
			console.log('List of events on calendar within time-range:');
			const events = allEvents.filter(event => event.summary.includes('Fechado') === false);
			return events;
		}).catch((err) => {
			console.log(`Error: listSingleEvents -${err.message}`);
		});

	return result;
}

module.exports.getAllEvents = getAllEvents;

// Configures the default search param for calendar events.
// timeMin: the first date we should look for (The day the user is interacting)
// timemax: the limit of time
function setDefaultSearchParam() {
	const timeMin = new Date();
	const paramObj = {
		timeMin: timeMin.toISOString(),
		timeMax: '2019-12-31T23:55:00+08:00',
		//   q: 'query-string',
		singleEvents: true,
		orderBy: 'startTime',
	};

	return paramObj;
}
module.exports.setDefaultSearchParam = setDefaultSearchParam;

// Uses the userID to find events related only to that user. UsedID can be at the event summary (title) or description
function setUserSearchParam(userID) {
	const timeMin = new Date();
	const paramObj = {
		timeMin: timeMin.toISOString(),
		timeMax: '2019-12-31T23:55:00+08:00',
		q: userID,
		singleEvents: true,
		orderBy: 'startTime',
	};

	return paramObj;
}
module.exports.setUserSearchParam = setUserSearchParam;

// creates a new event
// Obs: your app needs write permission to do that, maybe your g-suite domain won't let you. Talk to your g-suite admin or use a new e-mail.
async function createEvent(event) {
	const result = await calendar.Events.insert(calendarId, event)
		.then((resp) => {
			console.log('inserted event:');
			return resp;
		})
		.catch((err) => {
			console.log(`Error: insertEvent-${err.message}`);
		});

	return result;
}
module.exports.createEvent = createEvent;


function setEvent(usedID) {
	const timeMin = new Date();
	const timeMax = new Date();
	timeMax.setHours(timeMax.getHours() + 1);

	const paramObj = {
		start: { dateTime: timeMin.toISOString() },
		end: { dateTime: timeMax.toISOString() },
		location: 'Eokoe',
		summary: `Evento do ${usedID}`,
		status: 'confirmed',
		description: 'teste teste teste',
		colorId: 6,
	};

	return paramObj;
}
module.exports.setEvent = setEvent;

const help = require('../helper');


async function checkFreeBusy(timeMin, timeMax) {
	const params = { timeMin, timeMax, items: [{ id: calendarId }] };

	const dateStringRsult = await calendar.FreeBusy.query(calendarId, params)
		.then(resp => resp)
		.catch((err) => {
			console.log(`Error: checkBusy -${err.message}`);
		});

	// converting the result dates to timestamps
	const timestampResult = [];
	dateStringRsult.forEach(async (element) => {
		timestampResult.push({
			start: help.moment(element.start).unix(),
			end: help.moment(element.end).unix(),
		});
	});

	console.log(timestampResult);

	return timestampResult;
}

module.exports.checkFreeBusy = checkFreeBusy;

// divide the time range in blocks of 1 hour
async function divideTimeRange(timeMin, finalData) {
	let currentDate = timeMin;
	const slices = {};
	let count = 0;

	while (finalData >= currentDate) { // while currentDate is not out of the bound
		currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60)); // jump to the next hour

		if (currentDate.getDay() === 0) { // check if day is Sunday
			currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60 * 24)); // skip one day to get to Monday
		} else if (currentDate.getDay() === 6) { // check if day is Saturday
			currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60 * 24 * 2)); // skip two days to get to Monday
		} else if ((currentDate.getHours() >= 0 && currentDate.getHours() < 6)) { // || currentDate.getHours() === 22 || currentDate.getHours() === '23'
			currentDate.setHours(7);
		}
		slices[count] = help.moment(currentDate).unix();
		count += 1;
	}
	return slices;
}

module.exports.divideTimeRange = divideTimeRange;
