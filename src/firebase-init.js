/**
 * How to start with database:
 * - https://firebase.google.com/docs/database/web/start
 * Read & write in database:
 * - https://firebase.google.com/docs/database/web/read-and-write
 * */

const FB_CONFIG = {
  apiKey: "AIzaSyCVzUg7Gdb87xiJZddXXUaLUP7H0JMKgmA",
  authDomain: "bp-speed-test.firebaseapp.com",
  databaseURL: "https://bp-speed-test.firebaseio.com",
  projectId: "bp-speed-test",
  storageBucket: "bp-speed-test.appspot.com",
  messagingSenderId: "900166357433"
};
firebase.initializeApp(FB_CONFIG);
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz".split("");
const NUM_CHARS_IN_HASH = 8;
let DB;


// after app loads, run firebaseMain
window.addEventListener("load", firebaseMain);

/**
 * this function, which is called at the very beginning of
 * after the website is fully loaded, places the database
 * object on the global variable "DB". This variable is
 * then used below.
 **/
function firebaseMain() {
  DB = firebase.database();
}

/**
 * given a username and how many points that user has, this
 * will store that user into the database at a random hash
 * key. 
 * so, our database has the following structure:
 *
 *   users/
 *     |-random hash
 *       |-username:score
 *     ...
 *     |-random hash
 *       |-username:score
 * 
 * why use the random hash? we don't actually care about 
 * the hash (as you will find that we're not using it in the
 * code except when creating the new reference). however, we
 * care about storing a list of users in our database with 
 * their scores. we could store the users as an array, but 
 * firebase doesn't support Arrays. For that reason, we must
 * get around it using unique keys. Take a look at 
 * FB_UTILS.renderUsersOnLeaderboard(...) and the following 
 * post by Google on Firebase: 
 * https://firebase.googleblog.com/2014/04/best-practices-arrays-in-firebase.html
 **/
function fbStoreUserInformation(username, points) {
  // create the player object to store
  const player_name = username.length > 0 ? username : "Anonymous";
  const obj = {};
  obj[player_name] = points;

  // create a new reference child (with a random hash)
  // for the new object to store
  const ref = DB.ref(`users`);
  const new_child_ref = ref.push();

  // store the new object into that reference
  new_child_ref.set(obj);
}

/**
 * this function, when called for the first time, it displays
 * the players in order of the points they earned on the 
 * leaderboard. Then, every time there is a "value" change in
 * the database, it re-displays the players with the new 
 * updated values. That's what the 'on("value", func)' does.
 **/
function fbRenderLeaderboard() {
  DB.ref("users")
    .on("value", (snapshot) => FB_UTILS.renderUsersOnLeaderboard(snapshot.val()));
}

const FB_UTILS = {
  /**
   * given the users as received from the database as a big
   * Object, this will get those users and render them in the
   * leaderboard in order of points from biggest to smallest.
   **/
  renderUsersOnLeaderboard(user_data) {
    const sorted_users = FB_UTILS.getSortedUsers(user_data);
    const leaderboard_ppl = document.querySelector("#lb-people");
    UTILS.removeAllChildren(leaderboard_ppl);

    sorted_users.forEach((player, index) => {
      // index + 1 because arrays are 0-indexed
      const ranking = index + 1;
      const [player_name, points] = player;
      const user_elm = FB_UTILS.createUserHTMLElement(player_name, points, ranking);
      leaderboard_ppl.appendChild(user_elm);
    });
  },
  /**
   * returns a list of lists of the form:
   * 
   *   [[username, points], ..., [username, points]]
   *
   * where the index indicates that that user has more points 
   * than the user in the next index.
   **/
  getSortedUsers(user_data) {
    const users = [];
    Object.keys(user_data).forEach(random_hash => {
      const user_obj = user_data[random_hash];
      const user_name = Object.keys(user_obj)[0];
      const points = user_obj[user_name];
      users.push([user_name, points]);
    });
    users.sort((a, b) => b[1] - a[1]);
    return users;
  },
  /**
   * creates an HTML element to be appended to the leaderboard
   * object
   **/
  createUserHTMLElement(player_name, points, ranking) {
    // ranking element
    const ranking_elm = document.createElement("span");
    ranking_elm.setAttribute("class", "lb-rp-ranking");
    ranking_elm.appendChild(document.createTextNode(ranking));
    
    // name element
    const name_elm = document.createElement("span");
    name_elm.setAttribute("class", "lb-rp-name");
    name_elm.appendChild(document.createTextNode(player_name));
    
    // point element
    const point_elm = document.createElement("span");
    point_elm.setAttribute("class", "lb-rp-point");
    point_elm.appendChild(document.createTextNode(points));

    // final user element
    const new_user = document.createElement("div");
    new_user.setAttribute("class", "lb-ranked-player");
    new_user.appendChild(ranking_elm);
    new_user.appendChild(name_elm);
    new_user.appendChild(point_elm);
    return new_user;
  },
};

