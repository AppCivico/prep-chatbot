const req = require('requisition');

const { MessengerClient } = require('messaging-api-messenger');
const config = require('../bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const pageToken = config.accessToken;

// creates a new label. Pass in the name of the label and add the return ID to the .env file
async function createNewLabel(name) {
	const res = await req.post(`https://graph.facebook.com/v2.11/me/custom_labels?access_token=${pageToken}`).query({ name });
	const response = await res.json();
	return response;
}

// get every label
async function listAllLabels() { // eslint-disable-line no-unused-vars
	const res = await req.get(`https://graph.facebook.com/v2.11/me/custom_labels?fields=name&access_token=${pageToken}`);
	const response = await res.json();
	return response;
}


async function getBroadcastMetrics(broadcastID) {
	const res = await req.get(`https://graph.facebook.com/v2.11/${broadcastID}/insights/messages_sent?access_token=${pageToken}`);
	const response = await res.json();
	return response;
}

async function dissociateLabelsFromUser(UserID) {
	const userLabels = await client.getAssociatedLabels(UserID);
	if (userLabels.data) {
		await userLabels.data.forEach(async (element) => {
			await client.dissociateLabel(UserID, element.id);
		});
		return true;
	}
	return false;
}

async function addUserToBlackList(UserID) {
	return client.associateLabel(UserID, process.env.LABEL_BLACKLIST);
}

async function removeUserFromBlackList(UserID) {
	return client.dissociateLabel(UserID, process.env.LABEL_BLACKLIST);
}

async function checkUserOnLabel(UserID, labelID) { // checks if user is on the label
	const userLabels = await client.getAssociatedLabels(UserID);
	const theOneLabel = await userLabels.data.find(x => x.id === `${labelID}`); // find the one label with the name same

	if (theOneLabel) { // if we found the label on the user
		return true;
	}
	return false;
}

// Associates user to a label. Pass in the custom label id and the user psid
// associatesLabelToUser('123123', process.env.LABEL_ADMIN);
async function associatesLabelToUser(userID, labelID) {
	if (await checkUserOnLabel(userID, labelID) === true) {
		return true;
	}

	const userLabels = await client.getAssociatedLabels(userID);
	if (userLabels.data.length >= 20) { // actual facebook limit is 25 (by limit i mean before pagination starts to act up)
		userLabels.data.forEach(async (element) => {
			if (element.id !== process.env.LABEL_ADMIN) { // remove every tag except for admin
				client.dissociateLabel(userID, element.id);
			}
		});
	}

	return client.associateLabel(userID, labelID);
}

async function getLabelID(labelName) {
	const labelList = await client.getLabelList();

	const theOneLabel = await labelList.data.find(x => x.name === `${labelName}`);
	if (theOneLabel && theOneLabel.id) { // check if label exists
		return theOneLabel.id;
	}
	const newLabel = await client.createLabel(labelName);
	if (newLabel) {
		return newLabel.id;
	}
	return undefined;
}

// link an user to an agendaLabel
// each angendaLabel is 'agenda' + 'ID of the CCS' -> agenda1110
// All of the are going to be created and associated
async function linkUserToCustomLabel(UserID, labelName) {
	const ourLabels = await listAllLabels(); // get all labels we have
	const theOneLabel = await ourLabels.data.find(x => x.name === labelName); // find the one label with the name same (we need the id)
	console.log('ourLabels', ourLabels);
	console.log('theOneLabel', theOneLabel);

	if (theOneLabel) { // if we already have that label, all we have to do is associate the user to the id
		return associatesLabelToUser(UserID, theOneLabel.id);
	}
	// no theOneLabel exists so we have to create it
	const newLabel = await createNewLabel(labelName);
	console.log('newLabel', newLabel);

	if (!newLabel.error) { // no errors, so we can add the user to the label
		console.log(associatesLabelToUser(UserID, newLabel.id));
	}
	return newLabel;
}


module.exports = {
	linkUserToCustomLabel,
	getLabelID,
	associatesLabelToUser,
	checkUserOnLabel,
	removeUserFromBlackList,
	addUserToBlackList,
	dissociateLabelsFromUser,
	createNewLabel,
	listAllLabels,
	getBroadcastMetrics,

};