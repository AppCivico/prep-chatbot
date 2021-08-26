/* eslint camelcase: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF
const axios = require('axios');
const { handleRequestAnswer } = require('./error');
const { sentryError } = require('./error');

const apiUri = process.env.PREP_API_URL;
const security_token = process.env.SECURITY_TOKEN_PREP;
const security_token2 = process.env.SECURITY_TOKEN_PREP2;

const makeRequest = async (opt) => {
    try {
        if (opt.params && !opt.params.security_token) opt.params.security_token = security_token;
        // const result = await axios(opt).then((res) => res).catch((err) => err.response);
        const result = await axios(opt);
        console.log('req para prep_api');
        console.log(result);
        return handleRequestAnswer(result);
    } catch (error) {
        console.log('Erro na requisição:', { opt, error });
        return {};
    }
};

module.exports = {
	async postRecipientPrep(fb_id, page_id, name) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'post', params: { fb_id, page_id, name } });
	},

	async putRecipientPrep(fb_id, recipient) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, ...recipient } });
	},

	async putUpdatePartOfResearch(fb_id, is_part_of_research) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, is_part_of_research } });
	},

	async putUpdateVoucherFlag(fb_id, voucher_type) { // voucher_type may be: sus, sisprep or combina
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, voucher_type } });
	},

	async putUpdateReminderBefore(fb_id, { string }) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, prep_reminder_before: 1, prep_reminder_before_interval: string } });
	},

	async putUpdateReminderAfter(fb_id, { string }) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, prep_reminder_after: 1, prep_reminder_after_interval: string } });
	},

	async putUpdateAlarme(fb_id, data, frascos, reminderSet = {}) {
		const params = {
			fb_id, prep_reminder_running_out: 1, prep_reminder_running_out_date: data, prep_reminder_running_out_count: frascos,
		};

		if (reminderSet.prep_reminder_before) params.prep_reminder_before = reminderSet.prep_reminder_before;
		if (reminderSet.prep_reminder_before_interval) params.prep_reminder_before_interval = reminderSet.prep_reminder_before_interval.string;
		if (reminderSet.prep_reminder_after) params.prep_reminder_after = reminderSet.prep_reminder_after;
		if (reminderSet.prep_reminder_after_interval) params.prep_reminder_after_interval = reminderSet.prep_reminder_after_interval.string;

		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params });
	},

	async putResetRunningOut(fb_id, reminderSet = {}) {
		const params = { fb_id, prep_reminder_running_out: 0 };

		if (reminderSet.prep_reminder_before) params.prep_reminder_before = reminderSet.prep_reminder_before;
		if (reminderSet.prep_reminder_before_interval) params.prep_reminder_before_interval = reminderSet.prep_reminder_before_interval.string;
		if (reminderSet.prep_reminder_after) params.prep_reminder_after = reminderSet.prep_reminder_after;
		if (reminderSet.prep_reminder_after_interval) params.prep_reminder_after_interval = reminderSet.prep_reminder_after_interval.string;

		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params });
	},

	async putUpdateNotificacao24(fb_id, { string: combina_reminder_hour_exact }, { string: combina_reminder_hours_before }) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, combina_reminder_hour_exact, combina_reminder_hours_before } });
	},

	async putUpdateNotificacao22(fb_id, combina_reminder_22h, combina_reminder_double) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, combina_reminder_22h, combina_reminder_double } });
	},

	async postRecipientTookMedicine(fb_id, yes_prep = 1) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/prep-reminder-yes`, method: 'post', params: { fb_id, yes_prep } });
    },
    
    async postRecipientDidNotTookMedicine(fb_id, yes_prep = 0) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/prep-reminder-no`, method: 'post', params: { fb_id, yes_prep } });
	},

	async postAutoTeste(fb_id, address, contact) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/test-request`, method: 'post', params: { fb_id, address, contact } });
	},

	async postTestPrep(fb_id, prep) {
		return makeRequest({ url: `${apiUri}/api/internal/set-profile`, method: 'post', params: { fb_id, profile: prep ? 'prep' : 'not-prep', security_token: security_token2 } });
	},

	async postParticipar(fb_id, is_part_of_research) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/research-participation`, method: 'post', params: { fb_id, is_part_of_research } });
	},

	async getRecipientPrep(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/`, method: 'get', params: { fb_id } });
	},

	// opt_in: 0 -> turn off notifications; 1 -> turn on notifications
	async putRecipientNotification(fb_id, opt_in) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/`, method: 'put', params: { fb_id, opt_in } });
	},

	async getPendinQuestion(fb_id, category) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/pending-question`, method: 'get', params: { fb_id, category } });
	},

	async postQuizAnswer(fb_id, category, code, answer_value) {
		return makeRequest({
			url: `${apiUri}/api/chatbot/recipient/answer`,
			method: 'post',
			params: {
				fb_id, category, code, answer_value: await parseInt(answer_value, 10),
			},
		});
	},

	async deleteQuizAnswer(fb_id) {
		return makeRequest({ url: `${apiUri}/api/internal/delete-answers`, method: 'post', params: { security_token: security_token2 || security_token, fb_id } });
	},

	async getValidVouchers() {
		return makeRequest({ url: `${apiUri}/api/internal/available-combina-vouchers`, method: 'get', params: { security_token: security_token2 || security_token } });
	},

	async getAvailableCities() {
		return makeRequest({ url: `${apiUri}/api/chatbot/appointment/available-calendars`, method: 'get', params: { } });
	},

	async getAvailableDates(fb_id, calendar_id, page) {
		return makeRequest({ url: `${apiUri}/api/chatbot/appointment/available-dates`, method: 'get', params: { fb_id, calendar_id, page } });
	},

	async postAppointment(fb_id, calendar_id, type, appointment_window_id, quota_number, datetime_start, datetime_end) {
		return makeRequest({
			url: `${apiUri}/api/chatbot/recipient/appointment`,
			method: 'post',
			params: {
				fb_id, calendar_id, type, appointment_window_id, quota_number, datetime_start, datetime_end,
			},
		});
	},

	async getAppointment(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/appointment`, method: 'get', params: { fb_id } });
	},

	async postIntegrationPrepToken(fb_id, integration_token) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/integration-token`, method: 'post', params: { fb_id, integration_token } });
	},

	async putCombinaToken(fb_id, integration_token) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'put', params: { fb_id, voucher_type: 'combina', integration_token } });
	},

	async getCount(fb_id, type) {
		try {
			const result = await makeRequest({ url: `${apiUri}/api/chatbot/recipient/count-${type}`, method: 'get', params: { fb_id } });
			const keys = Object.keys(result);
			return result[keys[0]];
		} catch (error) {
			console.log('error', error);
			return sentryError('Erro ao pegar o contador', { error, fb_id, type });
		}
	},

	async postCount(fb_id, type) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/count-${type}`, method: 'post', params: { fb_id } });
	},

	async getCountResearch(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/count-research-invite`, method: 'get', params: { fb_id } });
	},

	async postCountResearch(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/count-research-invite`, method: 'post', params: { fb_id } });
	},

	async postSignature(fb_id, signed) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/term-signature`, method: 'post', params: { fb_id, signed } });
	},

	async resetTriagem(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/reset-screening`, method: 'post', params: { fb_id } });
	},

	async postRecipientInteraction(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/interaction`, method: 'post', params: { fb_id } });
	},

	async getRecipientInteraction(fb_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/interaction`, method: 'get', params: { fb_id } });
	},

	async postRecipientInteractionClose(fb_id, interaction_id) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/interaction/close`, method: 'post', params: { fb_id, interaction_id } });
	},

	async logFlowChange(recipient_fb_id, payload, button_text) {
		return makeRequest({ url: `${apiUri}/api/chatbot/recipient/quick-reply-log`, method: 'post', params: { fb_id: recipient_fb_id, payload, button_text } });
	},
};
