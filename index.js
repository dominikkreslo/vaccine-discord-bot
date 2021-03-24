//Discord variables
const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();
const prefix = "!";
//Api variables
const fetch = require("node-fetch");
//const sendEmail = require("./email.js");
//const sleepTime = 20 * 1000;
const zipCode = "08755"; // must be string to maintain leading zeros
const searchRadius = "10"; // in miles
const terminalLink = require("terminal-link");
const link = terminalLink(
  "Rite Aid Appointment Website",
  "https://www.riteaid.com/pharmacy/covid-qualifier"
);
//Calls api for stores
fetch(
  `https://www.riteaid.com/services/ext/v2/stores/getStores?address=${zipCode}&attrFilter=PREF-112&fetchMechanismVersion=2&radius=${searchRadius}`
)
  .then((res) => res.json())
  .then((res) => {
    getAvailability(res.Data.stores);
  });

client.on("message", function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
});

client.login(config.BOT_TOKEN);

function getAvailability(stores) {
  let promise = [];
  for (const store of stores) {
    promise.push(
      fetch(
        `https://www.riteaid.com/services/ext/v2/vaccine/checkSlots?storeNumber=${store.storeNumber}`
      ).then((res) => res.json())
    );
  }

  Promise.all(promises)
    .then((res) => {
      let available = [];

      res.map((res, index) => {
        const returnData = res.Data;
        const locationString = `${stores[index].address}, ${stores[index].city}`;
        if (returnData.slots["1"] || returnData.slots["2"]) {
          console.log(locationString, "\x1b[32m", "AVAILABLE", "\x1b[0m");

          available.push(locationString);
        } else {
          console.log(locationString, "\x1b[31m", "NOT AVAILABLE", "\x1b[0m");
        }
      });

      if (available.length > 0) {
      sendEmail(available);
      }
      return;
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setTimeout(() => {
        getAvailability(stores);
      }, sleepTime);
    });
}
