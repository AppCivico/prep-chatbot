require('dotenv').config();

const flow = require('./flow');
const opt = require('./options');
const help = require('./helper');
const prepApi = require('./prep_api');
const checkQR = require('./checkQR');
const aux = require('./consulta-aux');
const { sendMain } = require('./mainMenu');
const { sentryError } = require('./error');
const mainMenu = require('./mainMenu');
const mailer = require('./mailer');

async function sendSalvador(context) {
	if (context.state.user && context.state.user.city && context.state.user.city.toString() === '2') { await context.sendText(flow.consulta.salvadorMsg); }
}

async function sendExtraMessages(context) {
	// await context.setState({ sendExtraMessages2: true });
	if (context.state.sendExtraMessages2 === true) {
		await context.setState({ sendExtraMessages2: false, sendExtraMessages: false });
		// console.log('offline_pre_registration_form', context.state.registrationForm);
		if (context.state.registrationForm && context.state.registrationForm.length > 0) {
			try {
				await context.sendButtonTemplate(flow.quizYes.text2, await checkQR.buildButton(context.state.registrationForm, 'Pré-Cadastro'));
			} catch (error) {
				await context.sendButtonTemplate(flow.quizYes.text2, await checkQR.buildButton('https://sisprep1519.org/api', 'Pré-Cadastro'));
				await sentryError('Consulta - Não foi possível enviar o form de registro', context.state);
			}
		}
	}
}

async function sendConsultas(context) {
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
		const msg = await help.buildConsultaFinal(context.state, iterator);
		await context.sendText(msg);
	}

	if (context.state.voucher && context.state.voucher.length > 0) {
		await context.sendText(`Seu identificador: ${context.state.voucher}`);
	}
	await sendSalvador(context);
}

async function verConsulta(context) {
	if (context.state.user.is_target_audience) {
		await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
		if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
			await sendConsultas(context);
			await context.sendText(flow.consulta.view);
			await context.sendText(flow.mainMenu.text1, await checkQR.checkMainMenu(context));
		} else {
			await context.sendText(flow.verConsulta.zero);
		}
	} else {
		await sendMain(context);
	}
}

async function showDays(context) { // shows available days
	await context.setState({ calendarCurrent: context.state.calendar[context.state.paginationDate], calendarNext: context.state.calendar[context.state.paginationDate + 1] });
	await context.setState({ freeDays: await aux.separateDaysQR(context.state.calendarCurrent, context.state.calendarNext, context.state.paginationDate) });

	if (context.state.freeDays && context.state.freeDays.length > 0) {
		await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays });
	} else {
		await context.sendText(flow.consulta.fail1, opt.consultaFail);
		await sentryError('Consulta - Não foi possível exibir os dias', context.state);
	}
}

async function showHours(context, ymd) {
	await context.setState({ chosenDay: context.state.calendarCurrent.find((date) => date.ymd === ymd) }); // any day chosen from freeDays is in the calendarCurrent
	await context.setState({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });
	if (context.state.freeHours && context.state.freeHours.length > 0) {
		await context.sendText(flow.consulta.hours, { quick_replies: context.state.freeHours });
	} else {
		await context.sendText(flow.consulta.fail2, opt.consultaFail);
		await sentryError('Consulta - Não foi possível exibir as horas', context.state);
	}
}

async function finalDate(context, quota) { // where we actually schedule the consulta
	await context.setState({ paginationDate: 1, paginationHour: 1, dialog: '' }); // resetting pagination
	await context.setState({ chosenHour: context.state.chosenDay.hours.find((hour) => hour.quota === parseInt(quota, 10)) });

	await context.setState({
		appointmentResponse: await prepApi.postAppointment(
			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta || 'recrutamento',
			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
		),
	});

	await context.setState({ calendar: '' });

	if (context.state.appointmentResponse && context.state.appointmentResponse.id && !context.state.appointmentResponse.form_error) {
		const { appointments } = await prepApi.getAppointment(context.session.user.id);
		const consulta = appointments.find((x) => x.id === context.state.appointmentResponse.id);

		const msg = `${flow.consulta.success}\n${await help.buildConsultaFinal(context.state, consulta)}`;
		await context.sendText(msg);
		await context.sendText(flow.consulta.view);
		await sendSalvador(context);
		await sendExtraMessages(context);
		await context.typing(1000 * 3);

        let city;
        if (context.state.user.city) {
            city = context.state.user.city
        }
        else if (context.user.combina_city) {
            city = context.state.user.combina_city
        }
        else {
            city = 3 // SP
        }

        await mailer.sendMail("Amanda Selfie [PREP] - Nova consulta", msg, city);

		// after consulta, go to menu
		await sendMain(context);
		// if (context.state.nextDialog === 'ofertaPesquisaEnd') {
		// 	await context.setState({ dialog: 'ofertaPesquisaEnd' });
		// } else if (context.state.nextDialog === 'TCLE') {
		// 	await context.setState({ dialog: 'TCLE' });
		// } else {
		// 	await context.sendText(flow.mainMenu.text1, await checkQR.checkMainMenu(context));
		// }
	} else {
		await context.sendText(flow.consulta.fail3, opt.consultaFail);
		console.log('context.state.appointmentResponse', context.state.appointmentResponse);
		await sentryError('Consulta - Não foi possível marcar a consulta', context.state);
	}
}

async function loadCalendar(context) {
	/* load and prepare calendar */
	await context.setState({ paginationDate: 1, paginationHour: 1 }); // resetting pagination
	await context.setState({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.calendarID, context.state.paginationDate) }); // getting calendar
	await context.setState({ calendar: await context.state.calendar.dates.sort((obj1, obj2) => new Date(obj1.ymd) - new Date(obj2.ymd)) }); // order from closest date to fartest
	await context.setState({ calendar: await aux.cleanDates(context.state.calendar) });
	await context.setState({ calendar: await aux.separateDaysIntoPages(context.state.calendar) });
}

async function checkSP(context) {
	try {
		const cidade = context.state.user.city;
		const extraMsg = flow.consulta.cityMessages[cidade];
		const { calendars } = await prepApi.getAvailableCities();

		if (!cidade || cidade === '4') { // if user has no cidade send him back to the menu
			await sendMain(context);
		} 
		else if (cidade.toString() === '3') { // ask location for SP
			const spLocations = calendars.filter((x) => x.state === 'SP');
			const options = [];
			spLocations.forEach((e) => {
				options.push({
					content_type: 'text', title: e.name, payload: `askTypeSP${e.id}`,
				});
			});

			await context.sendText(extraMsg || 'Onde você prefere fazer?', { quick_replies: options });
		}
		else { // if its not SP send location and follow up with the regular
			if (extraMsg) await context.sendText(extraMsg);
			const calendar = await calendars.find((x) => x.state === help.siglaMap[cidade]);
			await context.setState({ calendarID: calendar.id });
			await loadCalendar(context);
			await showDays(context, true);
		}
	} catch (error) {
		console.log('error', error);
		await sentryError(error, context.state);
		await sendMain(context);
	}
}


async function startConsulta(context) {
	// user must be part of target__audience and have never had an appointment nor have left his contact info

	if (context.state.user.voucher_type === 'combina') {
		await mainMenu.falarComCombina(context);
		return;
	} if (context.state.user.voucher_type === 'sus') {
		await mainMenu.falarComSUS(context);
		return;
	}


	if (context.state.user.voucher_type || context.state.user.is_prep
 || (context.state.user.is_target_audience && ((await aux.checkAppointment(context.session.user.id) === false) && !context.state.leftContact))) {
		if (context.state.sendExtraMessages === true) {
			// because of "outras datas" we cant show the extraMessages again, but we still have to show the next ones
			await context.setState({ sendExtraMessages2: true, sendExtraMessages: false });
			await context.sendText(flow.quizYes.text3.replace('<LOCAL>', help.extraMessageDictionary[context.state.user.city]));
			await context.sendText(flow.quizYes.text4);
			await context.setState({ sendExtraMessages: false });
		}

		await checkSP(context);
	} else {
		await sendMain(context);
	}
}

async function checarConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		await context.sendText(flow.consulta.checar1);
		await sendConsultas(context);
		await context.sendText(flow.mainMenu.text1, await checkQR.checkMainMenu(context));
	} else {
		await loadCalendar(context);
	}
}

module.exports = {
	verConsulta,
	showDays,
	showHours,
	finalDate,
	checarConsulta,
	loadCalendar,
	startConsulta,
	checkSP,
	sendConsultas,
	sendSalvador,
	checkAppointment: aux.checkAppointment,
};
