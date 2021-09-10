const { moment } = require('./helper');
const { combinaCityDictionary } = require('./helper');
const { checkAppointment } = require('./consulta-aux');

function mainMenuFixedOrder(qr) {
    if (qr[0].payload === 'aboutAmanda'
        && qr[1].payload === 'noProjeto'
        && qr[2].payload === 'join'
        && qr[3].payload === 'seePreventions'
        && qr[4].title === 'Quero Participar'
        && qr[5].payload === 'baterPapo'
    ) {
        return [qr[4], qr[2], qr[1], qr[3], qr[0], qr[5]];
    }

    return qr;
}


async function checkMainMenu(context) {
    let opt = [];
    const baterPapo = { content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' };
    const quiz = { content_type: 'text', title: 'Quero Participar', payload: 'beginQuiz' };
    const quizRecrutamento = { content_type: 'text', title: 'Quero Participar', payload: 'recrutamento' };
    const quizBrincadeira = { content_type: 'text', title: 'Quero Participar', payload: 'querBrincadeira' };
    const prevencoes = { content_type: 'text', title: 'Prevenções', payload: 'seePreventions' };
    const join = { content_type: 'text', title: 'Já Tomo PrEP', payload: 'join' };
    const seePrepToken = { content_type: 'text', title: 'Ver meu Voucher', payload: 'seePrepToken' };
    const sobreAmanda = { content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' };
    const noProjeto = { content_type: 'text', title: 'Já tô no Projeto', payload: 'noProjeto' };
    const termos = { content_type: 'text', title: 'Termos', payload: 'TCLE' };
    // const pesquisa = { content_type: 'text', title: 'Pesquisa', payload: 'ofertaPesquisaStart' };
    const marcarConsulta = { content_type: 'text', title: 'Bate papo presencial', payload: 'pesquisaPresencial' };
    const deixarContato = { content_type: 'text', title: 'Bate papo virtual', payload: 'pesquisaVirtual' };
    const verConsulta = { content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' };

    // for preps
    const duvidaPrep = { content_type: 'text', title: 'Dúvidas', payload: 'duvidasPrep' };
    const deuRuimPrep = { content_type: 'text', title: 'Deu ruim pra vc', payload: 'deuRuimPrep' };
    const voltarTomarPrep = { content_type: 'text', title: 'Voltar a tomar PrEP', payload: 'voltarTomarPrep' };
    const alarmePrep = { content_type: 'text', title: 'Alarme para PrEP', payload: 'alarmePrep' };
    const tomeiPrep = { content_type: 'text', title: 'Tomei', payload: 'tomeiPrep' };
    const autoteste = { content_type: 'text', title: 'Quero Autoteste', payload: 'autotesteIntro' };
    // for not preps
    const duvidaNaoPrep = { content_type: 'text', title: 'Dúvidas', payload: 'duvidasNaoPrep' };
    const deuRuimNaoPrep = { content_type: 'text', title: 'Deu ruim pra vc', payload: 'deuRuimNaoPrep' };

    // Quero participar; Já tomo PrEP; Já to no projeto; Prevenções, sobre a Amanda, Bater Papo

    if (context.state.user.is_prep === null || context.state.user.is_prep === undefined) {
        opt.push(baterPapo);
        opt.push(quiz);
        opt.push(prevencoes);
        opt.push(join);
        opt.push(noProjeto);
        opt.push(sobreAmanda);

        if (context.state.publicoInteresseEnd) {
            const index = opt.findIndex((x) => x.payload === 'beginQuiz');
            if (context.state.user.is_target_audience === 0) {
                if (!context.state.quizBrincadeiraEnd) { if (typeof index === 'number') opt[index] = quizBrincadeira; } else
                    if (!context.state.preCadastroSignature) { if (typeof index === 'number') opt[index] = termos; }
                const indexJoin = opt.findIndex((x) => x.payload === 'join'); if (typeof indexJoin === 'number') opt.splice(indexJoin, 1);
                const indexProjeto = opt.findIndex((x) => x.payload === 'noProjeto'); if (typeof indexProjeto === 'number') opt.splice(indexProjeto, 1);
            }


            if (context.state.user.is_target_audience === 1) {
                // user is risk group and didnt answer recrutamento (bloco b)
                if (!context.state.recrutamentoEnd && context.state.user.risk_group) {
                    opt.splice(index, 0, quizRecrutamento);
                }

                await context.setState({ temConsulta: await checkAppointment(context.session.user.id) });
                if (!context.state.temConsulta) {
                    if (index) {
                        opt.splice(index, 0, marcarConsulta);
                        opt.splice(index + 1, 0, deixarContato);
                    }
                } else if (!context.state.preCadastroSignature) {
                    opt.splice(index, 0, termos);
                }

                if (context.state.temConsulta) {
                    opt.splice(index + 1, 0, verConsulta);
                }

                if (context.state.leftContact) {
                    opt.splice(index, 0, marcarConsulta);
                }

                // dont let the beginQuiz appear if it's target_audience
                const index2 = opt.findIndex((x) => x.payload === 'beginQuiz');
                if (index2) opt.splice(index2, 1);
            }
        }

        // dont show quiz option if either of brincadeira and recrutamento are answered, also dont show quiz if user is taget_audiece but is not in the risk group
        if (context.state.publicoInteresseEnd && (context.state.quizBrincadeiraEnd || (context.state.recrutamentoEnd
            || (context.state.user.is_target_audience && !context.state.user.risk_group)))) { opt = await opt.filter((x) => x.title !== 'Quero Participar'); } // dont show quiz option if user has finished the quiz

        if (context.state.user.integration_token) { // replace token options if user has one
            const index = opt.findIndex((x) => x.payload === 'join'); if (typeof index === 'number') opt[index] = seePrepToken;
            const index2 = opt.findIndex((x) => x.payload === 'noProjeto'); if (typeof index2 === 'number') opt.splice(index2, 1);
        }
    } else if (context.state.user.is_prep === 1) {
        if (context.state.user.voucher_type === 'sisprep') {
            opt = [baterPapo, duvidaPrep, deuRuimPrep, autoteste, voltarTomarPrep, alarmePrep, marcarConsulta];
        } else if (context.state.user.voucher_type === 'combina') {
            opt = [baterPapo, duvidaPrep, deuRuimPrep, autoteste, voltarTomarPrep, alarmePrep, tomeiPrep, marcarConsulta];
        } else {
            opt = [baterPapo, duvidaPrep, deuRuimPrep, autoteste, voltarTomarPrep, alarmePrep, marcarConsulta];
        }
    } else if (context.state.user.is_prep === 0) {
        opt = [baterPapo, duvidaNaoPrep, deuRuimNaoPrep, autoteste, marcarConsulta];
    }

    opt.reverse();

    const sobreIndex = opt.findIndex((x) => x.payload === 'aboutAmanda'); if (typeof sobreIndex === 'number') opt.push(opt.splice(sobreIndex, 1)[0]);

    return { quick_replies: mainMenuFixedOrder(opt) };
}

async function buildAlarmeBtn(hasAlarm) {
    const depois = { content_type: 'text', title: 'Voltar', payload: 'mainMenu' };
    const config = { content_type: 'text', title: 'Configurar Alarme', payload: 'alarmeConfigurar' };
    const cancelar = { content_type: 'text', title: 'Cancelar Alarme', payload: 'alarmeCancelarConfirma' };

    if (hasAlarm) return { quick_replies: [config, cancelar] };
    return { quick_replies: [depois, config] };
}

async function buildCombinaCity() {
    const opt = [];
    const cities = combinaCityDictionary;

    const ids = Object.keys(cities);

    ids.forEach((e) => {
        opt.push({ content_type: 'text', title: cities[e], payload: `combinaCity${e}` });
    });

    return { quick_replies: opt };
}

async function checkMedication(prepSince) { // eslint-disable-line
    const newOptions = [];
    const months = 4; // the time range for the user to be in the first stage of the treatment

    if (prepSince) {
        const modxDate = moment(prepSince);
        const diff = Math.abs(modxDate.diff(Date.now(), 'months'));

        // if the difference between now and the user prepSince date is bigger than 4 months than he is not on the first stage anymore
        if (diff >= months) {
            newOptions.push({ content_type: 'text', title: 'Sintomas', payload: 'sintomas' });
        }
    }
    newOptions.push({ content_type: 'text', title: 'Acabou o Remédio', payload: 'acabouRemedio' });
    newOptions.push({ content_type: 'text', title: 'Esqueci de tomar', payload: 'esqueciDeTomar' });
    newOptions.push({ content_type: 'text', title: 'Dúvida com o Remédio', payload: 'duvidaComRemedio' });

    return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

async function autotesteOption(options, cityId) {
    let newOptions = options.quick_replies;
    // no need to filter out cityId = 3
    if (cityId && cityId.toString() === '1') { // belo horizonte
        newOptions = await newOptions.filter((obj) => obj.payload !== 'rua');
        newOptions = await newOptions.filter((obj) => obj.payload !== 'ong');
    } else if (cityId && cityId.toString() === '2') { // salvador
        newOptions = await newOptions.filter((obj) => obj.payload !== 'rua');
        newOptions = await newOptions.filter((obj) => obj.payload !== 'auto');
    }
    return { quick_replies: newOptions };
}

// only users that are on sisprep and combina can see the drpNaoTomei option
async function checkDeuRuimPrep(context, opt) {
    if (['sisprep', 'combina'].includes(context.state.user.voucher_type) === false) {
        opt.quick_replies = opt.quick_replies.filter((x) => x.payload !== 'drpNaoTomei');
    }
    return opt;
}

async function getErrorQR(lastPostback) { // eslint-disable-line
    const elements = [];
    // const firstArray = opt.menuOptions;

    // firstArray.forEach((element, index) => {
    // 	elements.push({
    // 		content_type: 'text',
    // 		title: element,
    // 		payload: opt.menuPostback[index],
    // 	});
    // });

    elements.push({
        content_type: 'text',
        title: 'Voltar para o Menu',
        payload: 'mainMenu',
    });

    // if (lastPostback && lastPostback.length > 0) {
    // 	elements.push({
    // 		content_type: 'text',
    // 		title: 'Tentar de novo',
    // 		payload: lastPostback,
    // 	});
    // }

    return { quick_replies: elements };
}

async function buildButton(url, title) {
    return [{
        type: 'web_url',
        url,
        title,
    }];
}

async function sendShare(context, links, results, imagem) {
    const subtitle = results && results[0] ? results[0] : 'Chatbot';

    await context.sendAttachment({
        type: 'template',
        payload: {
            template_type: 'generic',
            elements: [
                {
                    title: links.siteTitle,
                    subtitle,
                    image_url: imagem || '',
                    item_url: links.siteURL,
                    buttons: [
                        {
                            type: 'element_share',
                            share_contents: {
                                attachment: {
                                    type: 'template',
                                    payload: {
                                        template_type: 'generic',
                                        elements: [
                                            {
                                                title: links.siteTitle2,
                                                subtitle,
                                                // image_url: imagem || '',
                                                default_action: {
                                                    type: 'web_url',
                                                    url: links.siteURL,
                                                },
                                                buttons: [
                                                    {
                                                        type: 'web_url',
                                                        url: links.siteURL,
                                                        title: 'Conheçer',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        },
    });
}

module.exports = {
    checkMainMenu,
    checkMedication,
    autotesteOption,
    getErrorQR,
    buildButton,
    sendShare,
    checkDeuRuimPrep,
    buildAlarmeBtn,
    buildCombinaCity,
};
