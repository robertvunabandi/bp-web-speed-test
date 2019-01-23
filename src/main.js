const NUM_ROUNDS = 5;
const NUM_SQUARES = 10;
const MIN_LIGHT_UP_TIME_MS = 500;
const MAX_LIGHT_UP_TIME_MS = 5000;
const MAX_TIME_TO_CLICK = 2000;
const LIGHT_UP_COLOR = "#305C91";

window.addEventListener("load", main);

function main() {
  initializeGame();
  // the next function comes from firebase-init.js
  fbRenderLeaderboard();
}

/**
 * Game
 **/

function initializeGame() {
  const speed_test_game = new SpeedTestGame();
  speed_test_game.restart();
}

/**
 * The game class
 **/

class SpeedTestGame {
  // have NUM_ROUNDS divs such that a cell will light up,
  // and one has to click it as fast as possible
  // game.appendChild(messageBox);
  constructor() {
    this.points = 0.0;
    this.round = -1;
    this.username = null;
  }

  restart() {
    this.points = 0.0;
    this.round = -1;
    this.username = null;
    SpeedTestGame.setActionText("Start New Game");
    this.updateStatusBar();
    this.activateButtons();
  }

  activateButtons() {
    const action_button = document.querySelector("#stg-action-button");
    action_button.onclick = this.nextRound.bind(this);
  }

  static deactivateButtons() {
    const action_button = document.querySelector("#stg-action-button");
    action_button.onclick = null;
  }

  nextRound() {
    // game is already finished
    if (this.round > NUM_ROUNDS) {
      return;
    }
    this.round += 1;
    // we are ending the game
    if (this.round > NUM_ROUNDS) {
      this.endGame();
      return;
    }

    // update the status with the new round
    this.updateStatusBar();

    // round 0, explain the rules
    if (this.round === 0) {
      SpeedTestGame.setMessage([
        `You have ${NUM_ROUNDS} rounds. In each round, select the square that ` +
        "lights up as fast as possible. The faster you select, the more points " +
        "you get. The square will light randomly in under 1-5 seconds. ",
        "Press the Next Round button to continue."
      ]);
      SpeedTestGame.setActionText("Next Round");
      return;
    }
    // if this is the last round, change the action text
    if (this.round === NUM_ROUNDS) {
      SpeedTestGame.setActionText("Finish Game");
    }
    // all other rounds, run the following lines
    this.startNextRound();
  }

  updateStatusBar() {
    const points_element = document.querySelector("#stg-status-points-val");
    points_element.innerText = this.points + "";
    const round_element = document.querySelector("#stg-status-round-val");
    round_element.innerText = (this.round >= 0 ? this.round : 0) + `/${NUM_ROUNDS}`;
  }

  endGame() {
    SpeedTestGame.setMessage(
      "Please enter your username then click on Submit! Note that doing this " +
      "will start the game over and send over your score. If you do not set a" +
      "username, it will be sent as Anonymous."
    );
    SpeedTestGame.showUsernameInputs();
    SpeedTestGame.deactivateButtons();
    document.querySelector("#stg-submit").onclick = () => {
      this.username = document.querySelector("#stg-username-input").value;
      this.sendOverScoresToFirebase();
      this.restart();
      SpeedTestGame.hideUsernameInputs();
    }
  }

  sendOverScoresToFirebase() {
    const username = this.username || "Anonymous";
    const points = this.points;
    fbStoreUserInformation(username, points);
  }

  startNextRound() {
    const square_id = SpeedTestGame.getRandomSquareId();
    const light_up_time_ms = SpeedTestGame.getRandomLightUpTime();
    const self = this;
    let time_left_to_click = MAX_TIME_TO_CLICK;
    let time_interval = null;

    const lightUpSquare = () => {
      SpeedTestGame.setSquareColorAndOnClick(square_id, LIGHT_UP_COLOR, lightOffSquare);
      time_interval = setInterval(function () {
        time_left_to_click -= 10;
        SpeedTestGame.setTime(time_left_to_click / 1000);
        if (time_left_to_click < 0) {
          lightOffSquare();
        }
      }, 10);
    };

    const lightOffSquare = () => {
      clearInterval(time_interval);
      self.points += time_left_to_click;
      SpeedTestGame.setSquareColorAndOnClick(square_id, null, null);
      self.activateButtons();
      this.updateStatusBar();
    };

    SpeedTestGame.deactivateButtons();
    SpeedTestGame.setTime("__");
    setTimeout(lightUpSquare, light_up_time_ms);
  }

  /* static functions */

  static hideUsernameInputs() {
    document.querySelector("#stg-username").style.display = "none";
  }
  static showUsernameInputs() {
    document.querySelector("#stg-username").style.display = "block";
  }

  static setActionText(text) {
    const action_button = document.querySelector("#stg-action-button");
    action_button.setAttribute("value", text);
  }

  static setMessage(message) {
    const message_element = document.querySelector("#stg-message");
    UTILS.removeAllChildren(message_element);
    if (Array.isArray(message)) {
      for (let i = 0; i < message.length - 1; i += 1) {
        message_element.appendChild(document.createTextNode(message[i]));
        message_element.appendChild(document.createElement("br"));
      }
      message_element.appendChild(document.createTextNode(message[message.length - 1]));
      return;
    }
    message_element.appendChild(document.createTextNode(message));
  }

  static setTime(time) {
    document.querySelector("#stg-timer").innerHTML = time;
  }

  static getRandomSquareId() {
    let number = Math.ceil(Math.random() * NUM_SQUARES);
    return `stg-game-box-${number}`;
  }

  static getRandomLightUpTime() {
    return Math.round(Math.max(MIN_LIGHT_UP_TIME_MS, Math.random() * MAX_LIGHT_UP_TIME_MS));
  }

  static setSquareColorAndOnClick(square_id, color, onClick) {
    const square_element = document.querySelector("#" + square_id);
    square_element.children[0].style.backgroundColor = color;
    square_element.onclick = onClick;
  }
}

/**
 * Utility Functions
 **/

const UTILS = {
  removeAllChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },
};