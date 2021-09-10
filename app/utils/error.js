const { Sentry, moment } = require('./helper');
const { sendHTMLMail } = require('./mailer');

async function buildNormalErrorMsg(nome, err, state) {
  const date = new Date();
  let text = `Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} com ${nome} em ${process.env.ENV}=>`;

  if (err) { text += `\n\n\nErro:\n${err}`; }
  console.log(text);
  if (state) { text += `\n\n\nEstado:\n${JSON.stringify(state, null, 2)}`; }

  return text;
}


async function handleErrorApi(options, res, statusCode, err) {
  let msg = `Endereço: ${options.url}`;
  msg += `\nMethod: ${options.method}`;
  if (options.params) msg += `\nQuery: ${JSON.stringify(options.params, null, 2)}`;
  if (options.headers) msg += `\nHeaders: ${JSON.stringify(options.headers, null, 2)}`;
  msg += `\nMoment: ${new Date()}`;
  if (statusCode) msg += `\nStatus Code: ${statusCode}`;

  if (res) msg += `\nResposta: ${JSON.stringify(res, null, 2)}`;
  if (err) msg += `\nErro: ${err.stack || err}`;

  if (process.env.DEBUG === '1') console.log('----------------------------------------------', `\n${msg}`, '\n\n');

  const momento = moment().format();

  const shortLog = `${momento}: ${options.method.toUpperCase()} - ${options.url} ${statusCode}`;
  console.log(shortLog);
  if ((res && (res.error || res.form_error)) || (!res && err)) {
    if (process.env.ENV !== 'local') {
      msg += `\nEnv: ${process.env.ENV}`;
      await Sentry.captureMessage(msg);
    }
  }
}

async function handleRequestAnswer(response) {
  try {
    const { status } = response;
    const { data } = await response;
    await handleErrorApi(response.config, data, status, false);
    return data;
  } catch (error) {
    await handleErrorApi(response.config, false, null, error);
    return {};
  }
}

async function sentryError(msg, err) {
  let erro;
  if (typeof err === 'string') {
    erro = err;
  } else if (err && err.stack) {
    erro = err.stack;
  }

  if (process.env.ENV !== 'local') {
    Sentry.captureMessage(msg);
    // await sendHTMLMail(`Erro no PREP - AMANDASELFIE - ${process.env.ENV || ''}`, process.env.MAILERROR, `${msg || ''}\n\n${erro}`);
    console.log(`Error sent at ${new Date()}!\n `);
    console.log(`${msg} => ${erro}`);
  }
  return false;
}

module.exports = {
  handleRequestAnswer,
  buildNormalErrorMsg,
  Sentry,
  sentryError,
};
