const flow = require('./flow');
const { sendMain } = require('./mainMenu');

// timeOut timers
// 24 hours -> send follow-up -> 1000 * 60 * 60 * 24
// const followUpTimer = eval(process.env.FOLLOW_UP_TIMER); // eslint-disable-line

// timers -> object that stores timers. Each user_id stores it's respective timer.
const FollowUps = {};
// FollowUps -> stores timers for the regular follow-up message

module.exports.createBaterPapoTimer = async (userID, context) => {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	FollowUps[userID] = setTimeout(async () => { // wait 'MenuTimerlimit' to show options menu
		await sendMain(context);
		delete FollowUps[userID]; // deleting this timer from timers object
	}, 1000 * 20);
};

module.exports.deleteTimers = async (userID) => {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
};

// module.exports.followUpTimer = followUpTimer;

module.exports.sendCarouselSus = async (context, items) => {
	const elements = [];

	items.forEach(async (element) => {
		elements.push({
			title: element.title,
			// subtitle: element.subtitle,
			buttons: element.buttons,
		});
	});
	await context.sendText(flow.sus.text1);
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
	await sendMain(context);
};

// what we had for timer on handler.js
// if (!context.state.timerOneSent || context.state.timerOneSent === false) { // checks if we haven't sent the followup Timer already
// 	// checks if last activity has happened after the "timer" time period
// 	if ((context.event.rawEvent.timestamp - context.session.lastActivity) >= (timer.followUpTimer + 1000)) {
// 		// if it has, that means and the user interacted with the chatbot after we sent the timer (so, there's no need to send the timer again)
// 		await context.setState({ timerOneSent: true });
// 	} else { // creates the timer
// 		timer.createFollowUpTimer(context.session.user.id, context);
// 	}
// }
