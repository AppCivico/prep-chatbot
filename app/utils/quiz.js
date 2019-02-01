const prepApi = require('./prep_api.js');
const research = require('./research');
const { capQR } = require('./helper');

async function handleFlags(context, response) {
	if (response.is_eligible_for_research && response.is_eligible_for_research === 1) { // user is eligible for research -> sees "do you want to participate" question
		await context.setState({ is_eligible_for_research: true });
	} else if (response.is_eligible_for_research === 0) {
		await context.setState({ is_eligible_for_research: false });
	}

	if (response.is_part_of_research && response.is_part_of_research === 1) { // chooses to participate in the research
		await context.setState({ is_part_of_research: true });
	} else if (response.is_part_of_research === 0) {
		await context.setState({ is_part_of_research: false });
	}
}

async function endQuizA(context) {
	await context.setState({ finished_quiz: true });
	if (context.state.is_eligible_for_research === true) { // elegível pra pesquisa
		if (context.state.is_part_of_research === true) { // o que o usuário respondeu
			await research.researchSaidYes(context); // elegível, disse sim
		} else {
			await research.researchSaidNo(context); // elegível, disse não
		}
	} else {
		await research.notEligible(context); // não elegível pra pesquisa
	}
}


// builds quick_repliy menu from the question answer options
async function buildMultipleChoice(question) {
	const qrButtons = [];
	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `quiz${element}` });
	});

	if (question.extra_quick_replies && question.extra_quick_replies.length > 0) {
		question.extra_quick_replies.forEach(async (element, index) => {
			qrButtons.push({ content_type: 'text', title: await capQR(element.label), payload: `extraQuestion${index}` });
		});
	}

	return { quick_replies: qrButtons };
}

// loads next question and shows it to the user
async function answerQuizA(context) {
	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id) });
	console.log('\nA nova pergunta do get', context.state.currentQuestion, '\n');
	await handleFlags(context, context.state.currentQuestion);

	if (context.state.currentQuestion && context.state.currentQuestion.code === null) { // user already answered the quiz (user shouldn't be here)
		await endQuizA(context); // quiz is over
	} else { /* eslint-disable no-lonely-if */ // user is still answering the quiz
		if (context.state.currentQuestion.count_more === 10) { // encouragement message
			await context.sendText('Estamos indo bem, força! 💪💪');
		} else if (context.state.currentQuestion.count_more === 5) {
			await context.sendText('Calma, só mais algumas perguntinhas e a gente acaba 🌟🌟');
		} else if (context.state.currentQuestion.count_more === 2) {
			await context.sendText('Boa, estamos na reta final ✨✨');
		}

		if (context.state.currentQuestion.code === 'AC5') {
			if (context.state.currentQuestion.is_eligible_for_research === 1) {
				await research.onTheResearch(context); // elegível e respondeu Sim
			} else if (context.state.currentQuestion.is_eligible_for_research === 0) {
				await research.notOnResearch(context); // elegível e respondeu Não
			}
		}

		// showing question and answer options
		if (context.state.currentQuestion.type === 'multiple_choice') {
			await context.sendText(context.state.currentQuestion.text, await buildMultipleChoice(context.state.currentQuestion));
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.sendText(context.state.currentQuestion.text);
			await context.setState({ onTextQuiz: true });
		}
		/* eslint-enable no-lonely-if */
	} // -- answering quiz else
}

// extra questions -> explanation of obscure terms
// sends the answer to the question and sends user back to the question
async function AnswerExtraQuestion(context) {
	const index = context.state.lastQRpayload.replace('extraQuestion', '');
	const answer = context.state.currentQuestion.extra_quick_replies[index].text;
	await context.sendText(answer);
	await context.setState({ dialog: 'startQuizA' }); // re-asks same question
}

async function handleAnswerA(context, quizOpt) {
	// context.state.currentQuestion.code -> the code for the current question
	// quizOpt -> the quiz option the user clicked/wrote
	const sentAnswer = await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt);
	console.log('\nResultado do post da pergunta', sentAnswer, '\n');

	if (sentAnswer.error === 'Internal server error') { // error
		await context.sendText('Ops, tive um erro interno');
	} else if (sentAnswer.form_error && sentAnswer.form_error.answer_value && sentAnswer.form_error.answer_value === 'invalid') { // input format is wrong (text)
		await context.sendText('Formato inválido! Digite novamente!');
		// Date is: YYYY-MM-DD
		await context.setState({ dialog: 'startQuizA' }); // re-asks same question
	} else { /* eslint-disable no-lonely-if */ // no error, answer was saved successfully
		await handleFlags(context, sentAnswer);

		if (sentAnswer && sentAnswer.finished_quiz === 0) { // check if the quiz is over
			await context.setState({ finished_quiz: false });
			await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
		} else {
			await context.sendText('Você acabou o quiz! Bom trabalho! 👏👏👏');
			await context.setState({ finished_quiz: true });
			await endQuizA(context); // quiz is over
		}
		/* eslint-enable no-lonely-if */
	}
}

module.exports.answerQuizA = answerQuizA;
module.exports.handleAnswerA = handleAnswerA;
module.exports.AnswerExtraQuestion = AnswerExtraQuestion;
module.exports.endQuizA = endQuizA;
