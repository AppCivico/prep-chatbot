const { sendMain } = require('./mainMenu');
const desafio = require('./desafio');

// timeOut timers
// 24 hours -> send follow-up -> 1000 * 60 * 60 * 24
// const followUpTimer = eval(process.env.FOLLOW_UP_TIMER); // eslint-disable-line

// timers -> object that stores timers. Each user_id stores it's respective timer.
const FollowUps = {};
// FollowUps -> stores timers for the regular follow-up message

async function createBaterPapoTimer(userID, context) {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	FollowUps[userID] = setTimeout(async () => { // wait 'MenuTimerlimit' to show options menu
		await sendMain(context);
		delete FollowUps[userID]; // deleting this timer from timers object
	}, 1000 * 20);
}


const intentAnswerTimer = {};

async function createAnswerTimer(userID, context) {
	await context.typing(1000 * 30);
	await context.typing(1000 * 27);
	await desafio.followUpIntent(context);
}

async function deleteTimers(userID) {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	if (intentAnswerTimer[userID]) { clearTimeout(intentAnswerTimer[userID]); delete intentAnswerTimer[userID]; }
}


module.exports = {
	deleteTimers, createAnswerTimer, createBaterPapoTimer,
};
