const flow = require('./flow');
const { getQR } = require('./attach');
const { sendMain } = require('./mainMenu');
const { falarComHumano } = require('./mainMenu');
const help = require('./helper');
const { putUpdateNotificacao22 } = require('./prep_api');
const { putResetRunningOut } = require('./prep_api');
const { sendMailCorreio } = require('./mailer');

async function showCombinaContact(context) {
  const msg = await help.getCombinaContact(context.state.user.combina_city);
  if (msg) await context.sendText(msg);
}

async function prepDuvidaFollowUp(context, txt) {
  if (txt && typeof txt === 'string') await context.sendText(txt);

  switch (context.state.user.voucher_type) {
    case 'sisprep':
      await falarComHumano(context, null, flow.duvidasPrep.followUpSisPrep);
      break;
    case 'combina':
      await showCombinaContact(context);
      await sendMain(context);
      break;
    case 'sus':
      await context.sendText(flow.duvidasPrep.followUpSUS);
      await sendMain(context);
      break;
    default:
      await sendMain(context);
      break;
  }
}

async function alarmeHorario(page = 1, btnParam, textType = 1) {
  if (page < 0) { page = 2; }
  if (page > 2) { page = 0; }


  const opts = [];
  let pivot = page * 8;
  opts.push({ content_type: 'text', title: 'Mais Cedo', payload: `page${btnParam}${page - 1}` });

  for (let i = 1; i <= 8; i++) {
    let title = null;
    if (textType === 1) title = pivot === 1 ? `À ${pivot}` : `Às ${pivot}`;
    if (textType === 2 && pivot > 0) title = pivot === 1 ? `${pivot} hora antes` : `${pivot} horas antes`;

    if (title) opts.push({ content_type: 'text', title, payload: `${btnParam}${pivot}` });
    pivot += 1;
  }
  opts.push({ content_type: 'text', title: 'Mais Tarde', payload: `page${btnParam}${page + 1}` });

  return { quick_replies: opts };
}

async function alarmeMinuto(hora, btnParam) {
  const opts = [];
  let minutos = '00';

  while (minutos < 60) {
    opts.push({ content_type: 'text', title: `Às ${hora}:${minutos}`, payload: `${btnParam}${minutos}` });
    minutos = parseInt(minutos, 10) + 10;
  }

  return { quick_replies: opts };
}

async function receivePage(context) {
  const payload = context.state.lastQRpayload.replace('page', '');
  const nextDialog = context.state.pageKey;
  const newPage = payload.replace(nextDialog, '');

  await context.setState({ alarmePage: newPage, dialog: nextDialog });
}

async function buildChoiceDuration(hour, minutes) {
  let ts = new Date();
  ts.setHours(hour || 0);
  ts.setMinutes(minutes || 0);
  ts.setSeconds(0);
  ts.setMilliseconds(0);

  ts = await help.removeTimezone(ts);

  return { date: ts, string: ts.toISOString().slice(11, 19) };
}

async function formatDate(text) {
  const dateRegex = new RegExp(/^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|(([1][26]|[2468][048]|[3579][26])00))))$/g); // eslint-disable-line
  const isValid = dateRegex.test(text);
  if (!isValid) return false;

  const dateObject = help.moment(text, 'DD/MM/YYYY');
  const data = dateObject.toDate();
  if (data instanceof Date && !isNaN(data)) return data; // eslint-disable-line no-restricted-globals
  return false;
}

async function checkDate(date) {
  const today = help.moment(new Date());
  const data = help.moment(date);

  const dataAfterToday = data.isAfter(today);
  if (dataAfterToday === true) return 'A data da consulta passada não pode ser depois de hoje.';

  const monthDiff = data.diff(today, 'months');
  if (monthDiff < -6) return 'A data da sua consulta passada não pode ser de mais de 6 meses atrás.';

  const daysDiff = data.diff(today, 'days');
  if (daysDiff > -15) return { confirma: true, date }; // data só é válida se aconteceu antes de 15 dias

  return date;
}

async function alarmeDate(context) {
  let date = await formatDate(context.state.whatWasTyped);
  if (date) date = await checkDate(date);
  if (!date || typeof date === 'string') {
    await context.setState({ dialog: 'alarmeAcabarErro' });
  } else if (date && date.confirma) {
    await context.setState({ dialog: 'alarmeConfirmaData', dataUltimaConsulta: help.moment(date.date).format('YYYY-MM-DD') });
  } else {
    await context.setState({ dialog: 'alarmeAcabarFrascos', dataUltimaConsulta: help.moment(date).format('YYYY-MM-DD') });
  }

  return date;
}

async function alarmeSemMedicacao(context) {
  if (context.state.user.voucher_type === 'combina') {
    await context.sendText(flow.alarmePrep.alarmeSemMedicacaoExtra);
    await showCombinaContact(context);
  } else {
    await context.sendText(flow.alarmePrep.alarmeSemMedicacao);
  }
  await sendMain(context);
}

async function alarmeAcabarFinal(context, res) {
  if (res && res.running_out_wait_until && typeof res.running_out_wait_until === 'string') {
    const data = res.running_out_wait_until.replace(/-/g, '/');
    const data2 = res.running_out_date.replace(/-/g, '/');
    const now = new Date();
    const whenToWarn = await formatDate(data);
    const whenPillsEnd = await formatDate(data2);

    const isSameDayWarn = await help.checkSameDay(now, whenToWarn);
    const isSameDayEnd = await help.checkSameDay(now, whenPillsEnd);

    if (now > whenPillsEnd || isSameDayEnd) { // quando o dia que acaba é hoje ou antes de hoje
      await context.sendText(flow.alarmePrep.alarmeAcabar.text5);
      await putResetRunningOut(context.session.user.id, context.state.reminderSet);
      await falarComHumano(context);
    } else if (now > whenToWarn || isSameDayWarn) { // quando a data de avisar é hoje ou antes de hoje
      const format = await help.moment(whenPillsEnd).format('DD/MM/YYYY');
      await context.sendText(flow.alarmePrep.alarmeAcabar.text4.replace('<DATE>', format));
      await putResetRunningOut(context.session.user.id, context.state.reminderSet);
      await falarComHumano(context);
    } else if (whenToWarn > now) { // dia pra avisar que acaba cai depois de hoje
      await context.sendText(flow.alarmePrep.alarmeAcabar.text3.replace('<DATE>', data));
      await sendMain(context);
    }
  } else {
    await context.sendText(flow.alarmePrep.alarmeAcabar.fallback);
    await sendMain(context);
  }
}

async function opcaoAutoteste(context) {
  const autoCorreio = { content_type: 'text', title: 'Pelo correio', payload: 'autoCorreio' };
  const autoServico = { content_type: 'text', title: 'Pegar no serviço', payload: 'autoServico' };
  const voltar = { content_type: 'text', title: 'Voltar', payload: 'mainMenu' };
  const autoTenteBtn = [];

  if (context.state.user.voucher_type !== 'sus') autoTenteBtn.push(autoCorreio);

  if (context.state.user && context.state.user.voucher_type !== 'combina') autoTenteBtn.push(autoServico);
  autoTenteBtn.push(voltar);

  await context.sendText(flow.autoteste.offerType, { quick_replies: autoTenteBtn });
}

async function buildTestagem(cityID, newRule) {
  const { types } = flow.testagem;
  const rules = newRule || flow.testagem.rules[cityID];
  let msg = '';
  const opt = [];

  Object.keys(types).forEach((e) => {
    if (rules && rules.includes(e) && types[e]) {
      if (types[e].msg) msg += `${types[e].msg}\n\n`;
      if (types[e].opt) opt.push(types[e].opt);
    }
  });

  return { msg: msg.trim(), opt: { quick_replies: opt } };
}

async function sendAutotesteMsg(context) {
  await context.setState({ testagem: await buildTestagem(context.state.user.city) });
  if (context.state.testagem && context.state.testagem.msg && context.state.testagem.opt) {
    await context.sendText(flow.testagem.text1);
    await context.sendText(context.state.testagem.msg);
    await context.sendText(flow.testagem.text2, context.state.testagem.opt);
  } else {
    await sendMain(context);
  }
}

async function buildServicoInfo(cityID, cityType) {
  let text = '';
  const cID = cityID && cityID.toString() ? cityID.toString() : '';
  const cType = cityType && cityType.toString() ? cityType.toString() : '';

  const address = await help.cidadeDictionary(cID, cType);
  if (address) text += `Endereço: ${address}\n`;

  const phone = help.telefoneDictionary[cID];
  if (phone) text += `Telefone: ${phone}\n`;

  const horario = await help.horarioDictionary(cID, cType);
  if (horario) text += `Horário: ${horario}`;


  return text;
}

async function sendAutoServiçoMail(context) {
  let text = 'O usuário abaixo viu informações clicou no botão de Pegar no Serviço';

  if (context.state.name) text += `\n\nNome: ${context.state.name}`;
  if (context.state.id) text += `\nFacebook ID: ${context.state.id}`;
  if (context.state.user.voucher_type) text += `\nVoucher: ${context.state.user.voucher_type}`;
  if (context.state.phone) text += `\nTelefone: ${context.state.phone}`;
  if (context.state.insta) text += `\nInstagram: ${context.state.insta}`;

  await sendMailCorreio('Usuário interessado em Auto Serviço', text, context.state.user.city);
}

async function sendAutoServicoMsg(context, cityType) {
  await context.setState({ autotesteServicoMsg: await buildServicoInfo(context.state.user.city, cityType) });

  if (context.state.autotesteServicoMsg) await context.sendText(context.state.autotesteServicoMsg);
  await context.sendText(flow.autoteste.autoServicoEnd);
  await sendMain(context);
  await sendAutoServiçoMail(context);
}

async function autotesteServico(context) {
  if (context.state.user.voucher_type === 'combina') {
    await context.sendText(flow.autoteste.autoServicoCombina);
    await sendMain(context);
  } else if (context.state.user.voucher_type === 'sus') {
    await context.sendText(flow.autoteste.autoServicoSUS);
    await sendMain(context);
  } else if (context.state.user && context.state.user.city && context.state.user.city.toString() === '3') {
    await context.sendText(flow.autoteste.autoServicoSisprepSP, await getQR(flow.autoteste.autoServicoSisprepSPBtn));
  } else {
    await sendAutoServicoMsg(context);
  }
}

async function sendAlarmeIntro(context, btn, hasAlarm) {
  if (hasAlarm) {
    await context.sendText(flow.alarmePrep.hasAlarm, btn);
  } else {
    await context.sendText(flow.alarmePrep.noAlarm, btn);
  }
}

async function alarmeCancelar(context, { id }) {
  if (id) {
    await context.sendText(flow.alarmePrep.alarmeCancelarSuccess);
    await context.setState({ reminderSet: {} });
  } else {
    await context.sendText(flow.alarmePrep.alarmeCancelarFailure);
  }
  await sendMain(context);
}

async function handleCorreioEndereco(context, address) {
  if (address) {
    await context.setState({ autoCorreioEndereco: address });

    const { instagram, phone } = context.state.user;

    if (instagram && phone) {
      await context.setState({ dialog: 'autoCorreioConfirma', autoCorreioContato: `${instagram} ou ${phone}` });
    } else if (instagram || phone) {
      await context.setState({ dialog: 'autoCorreioConfirma', autoCorreioContato: instagram || phone });
    } else {
      await context.setState({ dialog: 'autoCorreioContato' });
    }
  } else {
    await context.sendText(flow.autoteste.autoCorreioInválido);
  }
}

async function naoTransouEnd(context) {
  await context.sendText(flow.tomeiPrep.naoTransou);
  let now = await help.removeTimezone(new Date());
  now = now.toISOString().slice(0, -1);
  await putUpdateNotificacao22(context.session.user.id, now, now);
  await sendMain(context);
}

async function askHorario(context, introText) {

  if (context.state.dialog === 'tomouPrep') {
    await context.setState({ dialog: 'tomouPrep' });
  }
  else {
    await context.setState({ dialog: 'askHorario' });
  }

  let text = introText ? introText.trim() : flow.askHorario.default;
  text += `\n${flow.askHorario.example}`;

  await context.sendText(text);
}

async function checkHorario(context, stateName, successDialog, invalidDialog) {
  const horarioRegex = new RegExp(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/g);
  const horario = context.state.whatWasTyped;
  const isValid = horarioRegex.test(horario);

  if (isValid && horario) {
    await context.setState({ [stateName]: horario, dialog: successDialog });
    return horario;
  }

  await context.sendText(flow.askHorario.failure);
  if (invalidDialog) await context.setState({ dialog: invalidDialog });
  return null;
}


async function alarmeConfigurar(context) {
  if (context.state.user.voucher_type === 'combina') {
    await context.sendText(flow.alarmePrep.comoTomando, await getQR(flow.alarmePrep.comoTomandoBtn));
  } else {
    await askHorario(context, flow.alarmePrep.alarmeNaHora1);
  }
}

module.exports = {
  showCombinaContact,
  prepDuvidaFollowUp,
  alarmeConfigurar,
  alarmeHorario,
  alarmeMinuto,
  buildChoiceDuration,
  receivePage,
  formatDate,
  checkDate,
  alarmeDate,
  buildTestagem,
  sendAutotesteMsg,
  buildServicoInfo,
  autotesteServico,
  sendAutoServicoMsg,
  sendAlarmeIntro,
  alarmeCancelar,
  alarmeSemMedicacao,
  alarmeAcabarFinal,
  handleCorreioEndereco,
  naoTransouEnd,
  askHorario,
  checkHorario,
  opcaoAutoteste,
};
