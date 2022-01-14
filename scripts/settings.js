let form = document.querySelector(".neon__form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let numPlayers;
  let players = document.querySelectorAll(".neon__number");
  console.log(players);

  players.forEach((player) => {
    if (player.checked) {
      numPlayers = new URLSearchParams();
      numPlayers.append("numberPlayers", player.value);
      window.location.href = "./pages/trivia.html?" + numPlayers.toString();
    }
  });
});
