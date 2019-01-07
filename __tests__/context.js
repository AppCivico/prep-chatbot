function quickReplyContext(payload, dialog, lastActivity = new Date()) {
	return {
		state: {
			dialog,
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
			},
		},
		event: {
			isQuickReply: true,
			quickReply: { payload },
			message: {
				quickReply: { payload },
				text: 'This qr was clicked',
			},
			rawEvent: { timestamp: new Date() },
		},
		sendText: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
	};
}

module.exports.quickReplyContext = quickReplyContext;

function textContext(text, dialog, lastActivity = new Date()) {
	return {
		state: {
			dialog,
			politicianData: {
				user_id: 2000,
				use_dialogflow: 1,
			},
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
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
		sendButtonTemplate: jest.fn(),
	};
}

module.exports.textContext = textContext;

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
