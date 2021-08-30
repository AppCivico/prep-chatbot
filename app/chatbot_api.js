/* eslint camelcase: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF
const axios = require('axios');
const { handleRequestAnswer } = require('./utils/error');

const apiUri = process.env.MANDATOABERTO_API_URL;
const security_token = process.env.SECURITY_TOKEN_MA;

const makeRequest = async (opt) => {
  try {
    if (opt.params) opt.params.security_token = security_token;
    // const result = axios(opt).then((res) => res).catch((err) => err.response);
    const result = await axios(opt);
    return handleRequestAnswer(result);
  } catch (error) {
    console.log('Erro na requisição:', { opt, error });
    return {};
  }
};

module.exports = {
  async getPoliticianData(fb_page_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/politician`, method: 'get', params: { fb_page_id } });
  },

  async getRecipient(politician_id, fb_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'get', params: { politician_id, fb_id } });
  },

  async addAssistenteUser(name, email, password) {
    return makeRequest({ url: `${apiUri}/api/register`, method: 'post', params: { name, email, password } });
  },

  async postRecipientMA(politician_id, recipient) {
    return makeRequest({ url: `${apiUri}/api/chatbot/recipient`, method: 'post', params: { ...recipient, politician_id } });
  },

  async postRecipientLabel(politician_id, fb_id, label) {
    return makeRequest({
      url: `${apiUri}/api/chatbot/recipient`,
      method: 'post',
      params: {
        politician_id, security_token, fb_id, extra_fields: JSON.stringify({ system_labels: [{ name: label }] }),
      },
    });
  },

  async deleteRecipientLabel(politician_id, fb_id, label) {
    return makeRequest({
      url: `${apiUri}/api/chatbot/recipient`,
      method: 'post',
      params: {
        politician_id, security_token, fb_id, extra_fields: JSON.stringify({ system_labels: [{ name: label, deleted: 1 }] }),
      },
    });
  },

  async getPollData(fb_page_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/poll`, method: 'get', params: { fb_page_id } });
  },

  async postPollAnswer(fb_id, poll_question_option_id, origin) {
    return makeRequest({ url: `${apiUri}/api/chatbot/poll-result`, method: 'post', params: { fb_id, poll_question_option_id, origin } });
  },

  async getPollAnswer(fb_id, poll_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/poll-result`, method: 'get', params: { fb_id, poll_id } });
  },

  async getDialog(politician_id, dialog_name) {
    return makeRequest({ url: `${apiUri}/api/chatbot/dialog`, method: 'get', params: { politician_id, dialog_name } });
  },

  async getAnswer(politician_id, question_name) {
    return makeRequest({ url: `${apiUri}/api/chatbot/answer`, method: 'get', params: { politician_id, question_name } });
  },

  async postIssue(politician_id, fb_id, message, entities = {}, issue_active) {
    if (!issue_active) return {};

    const params = { politician_id, fb_id, message };

    if (entities && Object.keys(entities) && Object.keys(entities).length > 0) {
      entities = JSON.stringify(entities);
      params.entities = { result: entities };
    }

    return makeRequest({ url: `${apiUri}/api/chatbot/issue`, method: 'post', params });
  },

  async postIssueWithoutEntities(politician_id, fb_id, message, issue_active) {
    if (!issue_active) return {};
    // message = encodeURI(message);
    return makeRequest({ url: `${apiUri}/api/chatbot/issue`, method: 'post', params: { politician_id, fb_id, message } });
  },

  async getknowledgeBase(politician_id, entities, fb_id) {
    entities = JSON.stringify(entities);
    return makeRequest({ url: `${apiUri}/api/chatbot/knowledge-base`, method: 'get', params: { politician_id, entities, fb_id } });
  },

  async getknowledgeBaseByName(politician_id, intentName, fb_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/knowledge-base`, method: 'get', params: { politician_id, entities: intentName, fb_id } });
  },

  async postPrivateReply(entities, page_id, post_id, comment_id, permalink, user_id) {
    return makeRequest({
      url: `${apiUri}/api/chatbot/private-reply`,
      method: 'post',
      params: {
        page_id, entities, user_id, post_id, permalink, comment_id,
      },
    });
  },

  // 0 -> turn off notification && 1 -> turn on notification
  async updateBlacklistMA(recipient_id, active) {
    return makeRequest({ url: `${apiUri}/api/chatbot/blacklist`, method: 'post', params: { recipient_id, active } });
  },

  // has pagination
  async getAvailableIntents(fb_page_id, page) {
    return makeRequest({ url: `${apiUri}/api/chatbot/intents/available`, method: 'get', params: { fb_page_id, page } });
  },

  async getAllAvailableIntents(fb_page_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/intents/available`, method: 'get', params: { fb_page_id } });
  },

  async getTicketTypes(chatbot_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/ticket/type`, method: 'get', params: { chatbot_id } });
  },

  async getUserTickets(fb_id) {
    return makeRequest({ url: `${apiUri}/api/chatbot/ticket`, method: 'get', params: { fb_id } });
  },

  async putStatusTicket(TicketID, status) {
    return makeRequest({ url: `${apiUri}/api/chatbot/ticket/${TicketID}`, method: 'put', params: { status } });
  },

  async putAddMsgTicket(TicketID, message) {
    return makeRequest({ url: `${apiUri}/api/chatbot/ticket/${TicketID}`, method: 'put', params: { message } });
  },

  async postNewTicket(chatbot_id, fb_id, type_id, data, message = '', anonymous = 0, files = []) {
    const aux = {};
    if (files) files.forEach((e, i) => { aux[`ticket_attachment_${i}`] = e; });

    return makeRequest({
      url: `${apiUri}/api/chatbot/ticket`,
      method: 'post',
      params: {
        chatbot_id, fb_id, type_id, message, data: JSON.stringify(data), anonymous, ...aux,
      },
    });
  },

  async logFlowChange(recipient_fb_id, politician_id, payload, human_name) {
    const d = new Date();
    return makeRequest({
      url: `${apiUri}/api/chatbot/log`,
      method: 'post',
      params: {
        timestamp: d.toGMTString(), recipient_fb_id, politician_id, action_id: 1, payload, human_name,
      },
    });
  },

  async logAnsweredPoll(recipient_fb_id, politician_id, field_id) {
    const d = new Date();
    return makeRequest({
      url: `${apiUri}/api/chatbot/log`,
      method: 'post',
      params: {
        timestamp: d.toGMTString(), recipient_fb_id, politician_id, action_id: 2, field_id,
      },
    });
  },

  async logAskedEntity(recipient_fb_id, politician_id, field_id) {
    const d = new Date();

    return makeRequest({
      url: `${apiUri}/api/chatbot/log`,
      method: 'post',
      params: {
        timestamp: d.toGMTString(), recipient_fb_id, politician_id, action_id: 5, field_id,
      },
    });
  },

  // action_id should be 3 for ACTIVATED_NOTIFICATIONS and 4 for DEACTIVATED_NOTIFICATIONS
  async logNotification(recipient_fb_id, politician_id, action_id) {
    const d = new Date();

    return makeRequest({
      url: `${apiUri}/api/chatbot/log`,
      method: 'post',
      params: {
        timestamp: d.toGMTString(), recipient_fb_id, politician_id, action_id,
      },
    });
  },

  async getLogAction() {
    return makeRequest({ url: `${apiUri}/api/chatbot/log/actions`, method: 'get', params: {} });
  },

  async setIntentStatus(politician_id, recipient_fb_id, intent, entity_is_correct) {
    if (!intent || !intent.id) return false;

    return makeRequest({
      url: `${apiUri}/api/chatbot/politician/${politician_id}/intents/${intent.id}/stats`,
      method: 'post',
      params: { entity_is_correct, recipient_fb_id },
    });
  },

  async getPendinQuestion(fb_id, type = 'preparatory') {
    return makeRequest({
      url: `${apiUri}/api/chatbot/questionnaire/pending`,
      method: 'get',
      params: { fb_id, type },
    });
  },

  async postQuizAnswer(fb_id, type, code, answer_value) {
    return makeRequest({
      url: `${apiUri}/api/chatbot/questionnaire/answer`,
      method: 'post',
      params: {
        fb_id, type, code, answer_value,
      },
    });
  },

  async resetQuiz(fb_id, type) {
    return makeRequest({
      url: `${apiUri}/api/chatbot/questionnaire/reset`,
      method: 'post',
      params: { fb_id, type },
    });
  },

  // async dialogflowText(queryText, sessionId) {
  // 	return makeRequest({
  // 		url: `${dialogFlowAddress}/text-request`,
  // 		method: 'post',
  // 		data: { queryText, sessionId },
  // 	});
  // },
};
