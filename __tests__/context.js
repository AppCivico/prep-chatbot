require('dotenv').config();

function quickReplyContext(payload, dialog, lastActivity = new Date()) {
	return {
		state: {
			ignore: false,
			user: {},
			dialog,
			lastQRpayload: payload,
			politicianData: {
				user_id: 2000,
				use_dialogflow: 1,
			},
			name: 'Foo Bar',
			firstName: 'Foo',
			lastName: 'Bar',
			profilePic: 'foobar',
			id: 1000,
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			isQuickReply: true,
			quickReply: { payload: `novo${payload}` },
			message: {
				quick_reply: { payload },
				text: 'This qr was clicked',
			},
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
		typing: jest.fn(),
		getUserProfile: jest.fn(),
		Image: jest.fn(),
		Audio: jest.fn(),
		Video: jest.fn(),
		File: jest.fn(),
	};
}

function postbackContext(payload, title, dialog = 'prompt', lastActivity = new Date()) {
	return {
		state: {
			ignore: false,
			user: {},
			dialog,
			lastPBpayload: payload,
			politicianData: {
				user_id: 2000,
				use_dialogflow: 1,
			},
			name: 'Foo Bar',
			firstName: 'Foo',
			lastName: 'Bar',
			profilePic: 'foobar',
			id: 1000,
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			isPostback: true,
			postback: { payload, title },
			message: {
				quickReply: { payload },
				text: 'This qr was clicked',
			},
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
		typing: jest.fn(),
		getUserProfile: jest.fn(),
		Image: jest.fn(),
		Audio: jest.fn(),
		Video: jest.fn(),
		File: jest.fn(),
	};
}


function textContext(text, dialog, lastActivity = new Date()) {
	return {
		state: {
			ignore: false,
			user: {},
			dialog,
			politicianData: {
				user_id: 2000,
				use_dialogflow: 1,
			},
			name: 'Foo Bar',
			firstName: 'Foo',
			lastName: 'Bar',
			profilePic: 'foobar',
			id: 1000,
			whatWasTyped: text,
			toSend: text,
			apiaiResp: { result: { metadata: { intentName: 'teste' } } },
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			isMessage: true,
			isText: true,
			text,
			message: {
				text,
			},
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
		typing: jest.fn(),
		getUserProfile: jest.fn(),
		Image: jest.fn(),
		Audio: jest.fn(),
		Video: jest.fn(),
		File: jest.fn(),
	};
}

module.exports.knowledgeBase = {
	knowledge_base:
		[{
			id: 181,
			saved_attachment_id: '741993486156717',
			answer: 'Tenho essa resposta salva nos pontos de vista!',
			type: 'posicionamento',
			entities: [Array],
			saved_attachment_type: 'image',
		}],
};

module.exports.textContext = textContext;
module.exports.quickReplyContext = quickReplyContext;
module.exports.postbackContext = postbackContext;
