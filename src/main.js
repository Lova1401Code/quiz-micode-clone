import './style.css'
import { Questions } from '../question';


const TIMEOUT = 4000;

const app = document.querySelector("#app");

const startButton = document.querySelector("#start");

startButton.addEventListener("click", startQuiz)

const link = document.querySelector("a");

function startQuiz(event){
    console.log(event);
    let currentQuestion = 0;
    let score = 0;

    function clean(){
        while(app.firstElementChild){
            app.firstElementChild.remove();
        }
        const progress = displayProgressBar(Questions.length, currentQuestion);
        app.appendChild(progress);
    }

    displayQuestion(currentQuestion);

    function displayQuestion(currentQuestion){
        
        clean();

        const question = Questions[currentQuestion];

        if (!question) {
            displayFinishMessage();
            return;
        }

        const title = getTitleElement(question.question);
        app.appendChild(title);
        const answerDiv = createAnswers(question.answers);
        app.appendChild(answerDiv);
        const submitButton = getSubmitButton();
        app.appendChild(submitButton);
        submitButton.addEventListener("click", submit);
    }

    function displayProgressBar(max, value){
        const progress = document.createElement("progress");
        progress.setAttribute("max", max);
        progress.setAttribute("value", value);
        return progress
    }

    function displayFinishMessage(){
        const h1 = document.createElement("h1");
        h1.innerText = "Bravo! Tu as terminé le quiz";

        const p = document.createElement("p");
        p.innerText = `Tu as eu ${score} sur ${Questions.length} point!`;
        app.appendChild(h1);
        app.appendChild(p);
    }

    function submit(){
        const selectedAnswer = app.querySelector('input[name="answer"]:checked');

        disableAllAnswers();

        const value = selectedAnswer.value;

        const question = Questions[currentQuestion];

        const isCorrect = question.correct === value;

        if (isCorrect){
            score++;
        }
        showFeedback(isCorrect, question.correct, value);
        diplayNextQuestionButton(() => {
            currentQuestion ++;
            displayQuestion(currentQuestion);
        });
        const feedBackMessage = getFeedbackMessage(isCorrect, question.correct);
        app.appendChild(feedBackMessage);
    }

    function showFeedback(isCorrect, correct, answer){
        const correctAnswerId = formatId(correct);
        const correctElement = document.querySelector(`label[for="${correctAnswerId}"]`);

        const selectedAnswerId = formatId(answer);
        const selectedElement = document.querySelector(`label[for="${selectedAnswerId}"]`);

        correctElement.classList.add("correct");
        selectedElement.classList.add(isCorrect ? "correct" : "incorrect");

    };

    function getFeedbackMessage (isCorrect, correct){
        const paragraph = document.createElement("p");
        paragraph.innerText = isCorrect ? "Tu as eu la bonne réponse" : `Désolé... ma la bonne réponse était ${correct}`;
        return paragraph;
    }

    function createAnswers(answers) {
        const answerDiv = document.createElement("div");
        answerDiv.classList.add("answer");

        for (const answer of answers){
            const label = getAnswerElement(answer);
            answerDiv.appendChild(label);
        }

        return answerDiv;
    }

    function disableAllAnswers() {
        const radioInputs = document.querySelectorAll('input[type="radio"');
        for (const radio of radioInputs){
            radio.disabled = true;
        }
    }
}
function getTitleElement(text){
    const title = document.createElement("h3");
    title.innerText = text;
    return title;
}

function formatId(text){
    const id = text.replace(/[\u0300-\u036f]/g, "")
                   .replace(/[^a-z0-9\s-]/g, "") 
                   .replace(/\s+/g, "-")              
                   .replace(/-+/g, "-");  ;
    return id;
}

function getAnswerElement(text){
    const label = document.createElement("label");
    label.innerText = text;
    const input = document.createElement("input");
    const id = formatId(text);
    input.id = id;
    label.htmlFor = id;
    input.setAttribute("type", "radio");
    input.setAttribute("name", "answer");
    input.setAttribute("value", text);

    label.appendChild(input)

    return label;
}

function getSubmitButton(){
    const submitButton = document.createElement("button");
    submitButton.innerText = "submit";
    submitButton.type = "button";

    return submitButton;
}

function diplayNextQuestionButton(callback){
        let remainingTimeout = TIMEOUT;

        app.querySelector("button").remove();

        const getButtonText = () => `Next (${remainingTimeout/1000}s)`;

        const nextButton = document.createElement("button");
        nextButton.innerText = getButtonText();
        app.appendChild(nextButton);
        const interval = setInterval(() => {
            remainingTimeout -= 1000;
            nextButton.innerText = getButtonText();
        }, 1000);

        
        const timeout = setTimeout(() => {
            handleNextQuestion();
        }, TIMEOUT);

        const handleNextQuestion = () => {
            clearInterval(interval);
            clearTimeout(timeout);
            callback();
        }


        nextButton.addEventListener("click", () => {
            handleNextQuestion();
        })
    }