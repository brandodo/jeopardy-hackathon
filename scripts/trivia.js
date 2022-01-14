let questionBoxes = document.querySelectorAll(".question__item");
let selectedQuestion = document.querySelector(".selected-question");
let overlayBg = document.querySelector(".overlay");
let playerScoreboard = document.querySelector(".player-scoreboard");
let giphyAPIKey = "eFXa6sZe3b1BwD889es0gi4VBFlhUPAT";
let playerData = new URLSearchParams(window.location.search);
let numberOfPlayers = playerData.get("numberPlayers");
let randomTurn = Math.floor(Math.random() * numberOfPlayers + 1);

class Player {
  constructor(playerNumber, points) {
    this.playerNumber = playerNumber;
    this.points = points;
  }

  render() {
    return `
    <div class="player-scoreboard__player-container">
      <div id="player-${this.playerNumber}" class="player-scoreboard__label">Player ${this.playerNumber}</div>
      <div id="player-${this.playerNumber}-points" class="player-scoreboard__score">${this.points}</div>
    </div>
    `;
  }
}

class Question {
  constructor(question, difficulty, answer, choices) {
    this.question = question;
    this.difficulty = difficulty;
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
    addChoiceListeners(
      this.answer,
      questionContainer,
      answerContainer,
      this.difficulty
    );
  }
}

// build jeopardy game
function buildGame() {
  let difficulty;
  let category;
  let categoryId;
  let questions = [];
  let player;

  for (i = 1; i <= numberOfPlayers; i++) {
    player = new Player(i, 0);
    playerScoreboard.innerHTML += player.render();
  }

  turnTracker(randomTurn);

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
          questions[i].difficulty,
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

      while (x !== 3) {
        let rndNumber = Math.floor(Math.random() * responseLength);
        if (rndNumber !== randomNum) {
          questionObj.choices.push(respObj[rndNumber].answer);
          x++;
        }
      }
      // get additional answers for multiple choice
      // for (i = 0; i < responseLength; i++) {
      //   if (i !== randomNum) {
      //     questionObj.choices.push(respObj[i].answer);
      //     x++;
      //     if (x === 3) {
      //       break;
      //     }
      //   }
      // }
    })
    .catch((error) => {
      console.log("Could not retrieve questions");
    });

  return questionObj;
}

// add listeners for multiple choice options
function addChoiceListeners(answer, question, choices, points) {
  let optionsContainer = document.querySelectorAll(
    ".selected-question__option"
  );
  optionsContainer.forEach((choice) => {
    choice.addEventListener("click", (event) => {
      // check for correct answer and award points if so
      if (event.target.innerText === answer) {
        presentGif("correct");

        setTimeout(() => {
          question.parentNode.removeChild(question);
          choices.parentNode.removeChild(choices);
          selectedQuestion.style.display = "none";
          overlayBg.style.display = "none";

          awardPoints(randomTurn, points);

          // check if no more questions available
          checkEndGame();
        }, 5000);
      } else {
        presentGif("wrong");
      }

      // shift turn counter to next player
      setTimeout(() => {
        randomTurn++;

        if (randomTurn > numberOfPlayers) {
          randomTurn = 1;
        }

        turnTracker(randomTurn);
      }, 5000);
    });
  });
}

// use axios and GIPHY API to fetch appropriate gif for result
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
    })
    .catch((error) => {
      console.log("Could not retrieve gif");
    });
}

function turnTracker(counter) {
  let currentPlayer = document.getElementById("player-" + counter);
  let previousPlayer;

  if (currentPlayer.id === "player-1") {
    previousPlayer = document.getElementById("player-" + numberOfPlayers);
  } else {
    previousPlayer = document.getElementById("player-" + (counter - 1));
  }

  currentPlayer.style.fontWeight = "bold";
  currentPlayer.style.backgroundColor = "orange";
  previousPlayer.style.fontWeight = "normal";
  previousPlayer.style.backgroundColor = "";
}

function awardPoints(player, points) {
  let pointsContainer = document.getElementById("player-" + player + "-points");
  let currentPoints = Number(pointsContainer.innerText);
  let addPoints = Number(points);
  let newScore = currentPoints + addPoints;

  pointsContainer.innerText = newScore;
}

buildGame();
