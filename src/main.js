import './style.css'
import { fetchQuiz, fetchCategories } from './services/quizApi.js';
import fallbackQuestions from '../src/data/fallbackQuestions.json' assert { type: 'json' };

const TIMEOUT = 10000; // 10 secondes par question

const app = document.querySelector("#app");
const startButton = document.querySelector("#start");
const categorySelect = document.querySelector("#category");
const difficultySelect = document.querySelector("#difficulty");
const amountSelect = document.querySelector("#amount");

let quizData = [];
let currentQuestion = 0;
let score = 0;
let questionStartTime = 0;

// Charger les catégories au démarrage
loadCategories();

startButton.addEventListener("click", startQuiz);

async function loadCategories() {
  try {
    const categories = await fetchCategories();
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

async function startQuiz(event) {
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  const amount = parseInt(amountSelect.value);

  try {
    quizData = await fetchQuiz(amount, category, difficulty);
  } catch (error) {
    console.error('API failed, using fallback:', error);
    quizData = fallbackQuestions.slice(0, amount);
  }

  // Mélanger les questions et les réponses
  quizData = shuffleArray(quizData);
  quizData.forEach(question => {
    question.all_answers = shuffleArray([
      ...question.incorrect_answers,
      question.correct_answer
    ]);
  });

  currentQuestion = 0;
  score = 0;
  questionStartTime = Date.now();

  displayQuestion(currentQuestion);

    function displayQuestion(index) {
        clean();

        const question = quizData[index];

        if (!question) {
            displayFinishMessage();
            return;
        }

        questionStartTime = Date.now();

        // Afficher la catégorie et difficulté
        const meta = document.createElement('div');
        meta.className = 'question-meta';
        meta.innerHTML = `
          <span class="category">${question.category}</span>
          <span class="difficulty ${question.difficulty}">${question.difficulty}</span>
        `;
        app.appendChild(meta);

        const title = getTitleElement(decodeHTML(question.question));
        app.appendChild(title);
        
        // Timer
        const timerDiv = createTimer();
        app.appendChild(timerDiv);
        
        const answerDiv = createAnswers(question.all_answers);
        app.appendChild(answerDiv);
        const submitButton = getSubmitButton();
        app.appendChild(submitButton);
        submitButton.addEventListener("click", () => submit(question));
        
        // Démarrer le timer
        window.currentTimerInterval = startTimer();
    }

    function displayProgressBar(max, value) {
        const progress = document.createElement("progress");
        progress.setAttribute("max", max);
        progress.setAttribute("value", value);
        progress.className = 'progress-bar';
        return progress;
    }

    function createTimer() {
        const timerDiv = document.createElement('div');
        timerDiv.className = 'timer';
        const timerBar = document.createElement('div');
        timerBar.className = 'timer-bar';
        timerDiv.appendChild(timerBar);
        return timerDiv;
    }

    function startTimer() {
        const timerBar = document.querySelector('.timer-bar');
        let timeLeft = TIMEOUT;
        
        const interval = setInterval(() => {
            timeLeft -= 100;
            const percentage = (timeLeft / TIMEOUT) * 100;
            timerBar.style.width = percentage + '%';
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                submit(quizData[currentQuestion]);
            }
        }, 100);
        
        return interval;
    }

    function displayFinishMessage() {
        const percentage = Math.round((score / (quizData.length * 10)) * 100);
        let message = '';
        let emoji = '';
        
        if (percentage >= 80) {
            message = 'Excellent! 🎉';
        } else if (percentage >= 50) {
            message = 'Bien joué! 👍';
        } else {
            message = 'À améliorer 📚';
        }

        clean();
        
        const h1 = document.createElement("h1");
        h1.innerText = message;

        const stats = document.createElement('div');
        stats.className = 'final-stats';
        stats.innerHTML = `
          <p>Score: ${score} / ${quizData.length * 10} points</p>
          <p>Réussite: ${percentage}%</p>
          <p>Bonus rapidité: ${getBonusPoints()} points</p>
        `;
        
        const replayButton = document.createElement('button');
        replayButton.innerText = 'Rejouer';
        replayButton.className = 'replay-button';
        replayButton.addEventListener('click', () => location.reload());
        
        app.appendChild(h1);
        app.appendChild(stats);
        app.appendChild(replayButton);
        
        // Sauvegarder les statistiques
        saveStats(score, percentage);
    }

    function submit(question) {
        const selectedAnswer = app.querySelector('input[name="answer"]:checked');
        const timerInterval = window.currentTimerInterval;
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        disableAllAnswers();

        let isCorrect = false;
        let userAnswer = '';
        
        if (selectedAnswer) {
            userAnswer = selectedAnswer.value;
            isCorrect = userAnswer === question.correct_answer;
        }

        // Calculer les points
        let points = 0;
        if (isCorrect) {
            points = 10;
            const responseTime = Date.now() - questionStartTime;
            if (responseTime < 3000) {
                points += 5; // Bonus rapidité
            }
            score += points;
        }
        
        showFeedback(isCorrect, question.correct_answer, userAnswer);
        displayNextQuestionButton(() => {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
                displayQuestion(currentQuestion);
            } else {
                displayFinishMessage();
            }
        });
        
        const feedbackMessage = getFeedbackMessage(isCorrect, question.correct_answer, points);
        app.appendChild(feedbackMessage);
    }

    function showFeedback(isCorrect, correct, answer) {
        const correctAnswerId = formatId(correct);
        const correctElement = document.querySelector(`label[for="${correctAnswerId}"]`);

        if (correctElement) {
            correctElement.classList.add("correct");
        }

        if (answer) {
            const selectedAnswerId = formatId(answer);
            const selectedElement = document.querySelector(`label[for="${selectedAnswerId}"]`);
            
            if (selectedElement) {
                selectedElement.classList.add(isCorrect ? "correct" : "incorrect");
            }
        }
    }

    function getFeedbackMessage(isCorrect, correct, points) {
        const paragraph = document.createElement("p");
        paragraph.className = 'feedback-message';
        
        if (isCorrect) {
            paragraph.innerHTML = `✅ Bonne réponse! +${points} points${points > 10 ? ' (bonus rapidité!)' : ''}`;
        } else {
            paragraph.innerHTML = `❌ Mauvaise réponse. La bonne réponse était: <strong>${decodeHTML(correct)}</strong>`;
        }
        
        return paragraph;
    }

    function createAnswers(answers) {
        const answerDiv = document.createElement("div");
        answerDiv.classList.add("answer");

        for (const answer of answers) {
            const label = getAnswerElement(decodeHTML(answer));
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

    function clean() {
        while(app.firstElementChild) {
            app.firstElementChild.remove();
        }
        const progress = displayProgressBar(quizData.length, currentQuestion + 1);
        app.appendChild(progress);
    }

    function getBonusPoints() {
        // Calculer les bonus de rapidité (simplifié pour l'exemple)
        return Math.floor(score * 0.2); // 20% du score comme bonus
    }

    function saveStats(score, percentage) {
        const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');
        const newStats = {
            totalGames: (stats.totalGames || 0) + 1,
            bestScore: Math.max(stats.bestScore || 0, score),
            averageScore: ((stats.averageScore || 0) * stats.totalGames + score) / ((stats.totalGames || 0) + 1),
            lastScore: score,
            lastPercentage: percentage
        };
        localStorage.setItem('quizStats', JSON.stringify(newStats));
    }

    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    // Démarrer le timer pour la première question
    window.currentTimerInterval = startTimer();
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

    function displayNextQuestionButton(callback) {
        let remainingTimeout = 3000; // 3 secondes avant la prochaine question

        const submitButton = app.querySelector("button");
        if (submitButton) {
            submitButton.remove();
        }

        const getButtonText = () => `Next (${remainingTimeout/1000}s)`;

        const nextButton = document.createElement("button");
        nextButton.innerText = getButtonText();
        nextButton.className = 'next-button';
        app.appendChild(nextButton);
        
        const interval = setInterval(() => {
            remainingTimeout -= 1000;
            nextButton.innerText = getButtonText();
        }, 1000);

        const timeout = setTimeout(() => {
            handleNextQuestion();
        }, 3000);

        const handleNextQuestion = () => {
            clearInterval(interval);
            clearTimeout(timeout);
            callback();
        }

        nextButton.addEventListener("click", () => {
            handleNextQuestion();
        });
    }