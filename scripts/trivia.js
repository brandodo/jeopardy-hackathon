let questionBoxes = document.querySelectorAll(".question__item");
let selectedQuestion = document.querySelector(".selected-question");
let overlayBg = document.querySelector(".overlay");
let giphyAPIKey = "eFXa6sZe3b1BwD889es0gi4VBFlhUPAT";
let playerData = new URLSearchParams(window.location.search);
let numberOfPlayers = playerData.get("numberPlayers");

buildGame(numberOfPlayers);

class Question {
  constructor(question, answer, choices) {
    this.question = question;
    this.answer = answer;
    this.choices = choices;
  }

  buildQuestion() {
    let options = [];
    let randNum = Math.floor(Math.random() * 4);
    let questionContainer = document.createElement("div");
    let answerContainer = document.createElement("div");

    questionContainer.classList.add("selected-question__question");
    answerContainer.classList.add("selected-question__answers");

    for (i = 0; i < this.choices.length; i++) {
      options[i] = this.choices[i];
    }

    // insert answer into random position
    if (randNum === 3) {
      options.push(this.answer);
    } else {
      options.splice(randNum, 0, this.answer);
    }

    // append choices to container
    for (i = 0; i < options.length; i++) {
      let option = document.createElement("div");
      option.classList.add("selected-question__option");
      option.innerText = options[i];

      answerContainer.appendChild(option);
    }

    questionContainer.innerText = this.question;
    selectedQuestion.appendChild(questionContainer);
    selectedQuestion.appendChild(answerContainer);
    addChoiceListeners(this.answer, questionContainer, answerContainer);
  }
}

// build jeopardy game
function buildGame(nPlayers) {
  let difficulty;
  let category;
  let categoryId;
  let questions = [];

  // assign category Id for future use with API get
  questionBoxes.forEach((box) => {
    difficulty = box.innerText;
    category = box.parentNode.id;

    switch (category) {
      case "food":
        categoryId = "49";
        break;

      case "animals":
        categoryId = "21";
        break;

      case "movies":
        categoryId = "4";
        break;
    }

    questions.push(fetchQuestions(difficulty, category, categoryId));
  });

  questionBoxListeners(questions);
}

// add event listeners for when a box is clicked, and reveal question
function questionBoxListeners(questions) {
  console.log(questions);
  questionBoxes.forEach((box) => {
    box.addEventListener("click", presentQuestion);
  });

  // based on selected category and difficulty, present appropriate question and choices
  function presentQuestion(event) {
    let parentId = event.target.parentNode.id;
    let level = event.target.innerText;
    let currentQuestion;

    for (i = 0; i < questions.length; i++) {
      if (
        questions[i].category == parentId &&
        questions[i].difficulty == level
      ) {
        currentQuestion = new Question(
          questions[i].question,
          questions[i].answer,
          questions[i].choices
        );
        currentQuestion.buildQuestion();
        event.target.removeEventListener("click", presentQuestion);
        break;
      }
    }

    // stylistic effects when question is chosen
    overlayBg.style.display = "inline";
    event.target.style.backgroundColor = "black";
    selectedQuestion.style.display = "flex";
  }
}

// using axios, capture questions from API
function fetchQuestions(difficulty, category, categoryId) {
  let questionObj = {};
  let responseLength;
  let randomNum;
  let x = 0;

  axios
    .get(
      "http://jservice.io/api/clues?value=" +
        difficulty +
        "&category=" +
        categoryId
    )
    .then((response) => {
      respObj = response.data;
      responseLength = respObj.length;
      randomNum = Math.floor(Math.random() * responseLength);
      questionObj.question = respObj[randomNum].question;
      questionObj.answer = respObj[randomNum].answer;
      questionObj.difficulty = respObj[randomNum].value;
      questionObj.category = category;
      questionObj.choices = [];

      // get additional answers for multiple choice
      for (i = 0; i < responseLength; i++) {
        if (i !== randomNum) {
          questionObj.choices.push(respObj[i].answer);
          x++;
          if (x === 3) {
            break;
          }
        }
      }
    });

  return questionObj;
}

// add listeners for multiple choice options
function addChoiceListeners(answer, question, choices) {
  let optionsContainer = document.querySelectorAll(
    ".selected-question__option"
  );
  optionsContainer.forEach((choice) => {
    choice.addEventListener("click", (event) => {
      if (event.target.innerText === answer) {
        resolveAnswer(true, question, choices);
      } else {
        resolveAnswer(false);
      }
    });
  });
}

// return "correct" or "wrong" for selected answer
// use axios and GIPHY API to fetch appropriate gif for result
function resolveAnswer(result, question, choices) {
  if (result === true) {
    // get funny gif - "CORRECT!"
    presentGif("correct");

    // remove current question
    question.parentNode.removeChild(question);
    choices.parentNode.removeChild(choices);
    selectedQuestion.style.display = "none";
    overlayBg.style.display = "none";

    // assign points to player

    // shift turn counter to next player
  } else if (result === false) {
    // get funny gif - "WRONG!"
    presentGif("wrong");
    // shift turn counter to next player
  }
}

//
function presentGif(result) {
  let gifContainer = document.createElement("iframe");
  let gifData;
  let dataLength;
  let gifRandomNum;
  let selectedGif;

  axios
    .get(
      "https://api.giphy.com/v1/gifs/search?api_key=" +
        giphyAPIKey +
        "&q=" +
        result +
        "&rating=r"
    )
    .then((response) => {
      gifData = response.data.data;
      dataLength = gifData.length;
      gifRandomNum = Math.floor(Math.random() * dataLength);
      gifObject = gifData[gifRandomNum];
      selectedGif = gifObject.embed_url;

      gifContainer.classList.add("gif-box");
      gifContainer.setAttribute("src", selectedGif);
      gifContainer.setAttribute("width", gifObject.images.original.width);
      gifContainer.setAttribute("height", gifObject.images.original.height);

      document.body.insertBefore(gifContainer, selectedQuestion);
      setTimeout(() => {
        gifContainer.parentNode.removeChild(gifContainer);
      }, 5000);
    });
}
