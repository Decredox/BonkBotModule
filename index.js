const BonkClient = require("./module/Client.js");

const client = new BonkClient();

client.on("ready", async (bot) => {
  const room = await bot.setAdressByUrl("https://bonk.io/384632");
  bot.connect(room);
  console.log(room);
});

client.on("bonk_chat_message", async (chat) => {
  await chat.sendMessage(chat.message[chat.message.length - 1]);
});

client.login({
  username: "RoomManager",
  password: "mR#84vX2!qLp@Zu9Wd",
  avatar: {
    layers: [
      { id: 13, scale: 0.06, angle: 0, x: 5.14, y: 4.86, flipX: false, flipY: false, color: 13558016 },
      { id: 13, scale: 0.06, angle: 0, x: 0.29, y: 4.57, flipX: false, flipY: false, color: 13558016 },
      { id: 67, scale: 0.49, angle: -7, x: 0.86, y: 35.14, flipX: true, flipY: false, color: 16712725 },
      { id: 67, scale: 0.49, angle: 7, x: 0.86, y: 34.14, flipX: false, flipY: false, color: 16712724 },
      { id: 13, scale: 0.06, angle: 0, x: -5.71, y: 5.86, flipX: false, flipY: false, color: 13689088 },
      { id: 13, scale: 0.07, angle: 0, x: 2, y: -0.14, flipX: false, flipY: false, color: 1761792 },
      { id: 13, scale: 0.07, angle: 0, x: -2.57, y: -1.86, flipX: false, flipY: false, color: 1761792 },
      { id: 13, scale: 0.095, angle: 0, x: 0, y: -6.86, flipX: false, flipY: false, color: 235263 },
      { id: 28, scale: 0.2, angle: 0, x: 0, y: 8.6, flipX: true, flipY: false, color: 327746 },
      { id: 28, scale: 0.2, angle: 0, x: -6.3, y: 8.6, flipX: false, flipY: false, color: 327746 },
      { id: 28, scale: 0.2, angle: 0, x: 2.7, y: 1.7, flipX: false, flipY: false, color: 327746 },
      { id: 28, scale: 0.2, angle: 0, x: 6.2, y: 8.6, flipX: false, flipY: false, color: 327746 },
      { id: 28, scale: 0.2, angle: 0, x: -2.6, y: 1.7, flipX: false, flipY: false, color: 327746 },
      { id: 28, scale: 0.2, angle: 0, x: 0, y: -4, flipX: false, flipY: false, color: 327746 },
      { id: 80, scale: 0.069, angle: 0, x: 0, y: -7.5, flipX: false, flipY: false, color: 16765704 },
      { id: 80, scale: 0.38, angle: 0, x: 0, y: 8.11, flipX: false, flipY: false, color: 16383966 }
    ],
    bc: 327746
  }
});
