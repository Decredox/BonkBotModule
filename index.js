const BonkClient = require("./module/Client.js");

const client = new BonkClient();

client.on("ready", async (bot) => {
  console.log("Cliente autenticado com sucesso.");
  let room = await bot.setAdressByUrl("https://bonk.io/018748");
  bot.connect(room);
});

//LOGIN
client.login({
  username: "RoomManager",
  password: "mR#84vX2!qLp@Zu9Wd",
});

