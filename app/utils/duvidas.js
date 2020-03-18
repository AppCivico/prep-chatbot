const { duvidasPrep } = require('./flow');
const { ofertaPesquisaSim } = require('./flow');
const { getQR } = require('./attach');
const { sendMain } = require('./mainMenu');


async function prepFollowUp(context) {
	if (context.state.user.voucher_type === 'sus') {
		let text = duvidasPrep.textosSUS[context.state.user.city];
		if (!text) text = duvidasPrep.demaisLocalidades;
		if (text) await context.sendText(duvidasPrep.prefixSUS + text);
		await sendMain(context);
	} else {
		await context.setState({ nextDialog: '' });
		await context.sendText(duvidasPrep.notSUS, await getQR(ofertaPesquisaSim));
	}
}


module.exports = { prepFollowUp };