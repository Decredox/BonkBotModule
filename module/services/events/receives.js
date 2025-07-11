
const senders = require("./senders.js");
class Receives {
  constructor({ server, ws, send, disconnect, logger, emitter }) {
    
    this.server = server;
    this.ws = ws;
    this.emitter = emitter;
    this.logger = logger;

this.modes = {
   "b":{name: "Classic", info: ["b", "b"]},
   "ar":{name: "Arrows", info: ["b", "ar"]},
   "ard":{name: "Death Arrows", info: ["b", "ard"]},
   "sp":{name: "Grapple", info: ["b", "sp"]},
   "v":{name: "VTOL", info: ["b", "v"]},
   "f":{name: "Futebol", info: ["f", "f"]},
}
    this.state = {
      botId: undefined,
      hostId: undefined,
      roomId: undefined,
    };

    this.roomSettings = {
      rounds: 3,
      teamsLocked: undefined,
      // roomLocked: undefined,
      users: {},
      map: undefined,
      mode: undefined,
    
    };
    this.methods = new senders(
      send,
      this.roomSettings,
      this.state,
      disconnect
    );
    // this.adminUsers = {};
    // this.commandPrefix = "!";
    this.handlers = new Map();
    // this.commands = new Map();

    // Sistema de minigames
    // this.minigames = {
    //   active: false,
    //   currentGame: null,
    //   participants: new Set(),
    //   scores: {},
//   cooldowns: {}
    // };

    // this.initDefaultHandlers();
    // this.initAdminCommands();
    // this.initMinigameCommands();


    //quando muda o modo do jogo
    this.register("42[26", (data) => {
      this.roomSettings.mode = this.modes[data[2]];
    })





// ao entrar no game tem o mapa
    this.register("42[21", (data) => {
      this.roomSettings.map = data[1];
     });




    

    //time locked ou n
    this.register("42[19", (data) => {
      this.roomSettings.teamsLocked = data[1];
    })

    //quando o jogador fica tab ou volta
    this.register("42[52", (data) => {
      this.roomSettings.users[data[1]].tabbed = data[2];
      // console.log("TABBED: ", data[1], data[2]);
    });

    //Quando jogador alterna aperta ready
    this.register("42[8", (data) => {
      this.roomSettings.users[data[1]].ready = data[2];
      // console.log("APERTOU READY: ", data[1], data[2]);
    });

    //Quando usuario muda de time
    this.register("42[18", (data) => {
      this.roomSettings.users[data[1]].team = data[2];
      // console.log("MUDOU DE TIME: ", data[1], data[2]);
    });

    

    //Atualiza host
    this.register("42[41", (data) => {
      const hosts = data[1];
      this.state.hostId = hosts.newHost;
    });

    //pega link da sala
    this.register("42[49", (data) => {
      const room = data[1] + data[2];
      this.state.roomId = room.padStart(6, "0");
    });

    //quando entra na sala
     this.register("42[3", (data) => {
      this.state.botId = data[1];
      this.state.hostId = data[2];
      this.roomSettings.users = Object.fromEntries(
        Object.entries(data[3]).filter(
          ([key, value]) => value !== null && key !== this.state.botId
        )
      );
    });


        //quando alguem é kickado ou banido / [.., id, true para kick, false para ban]
    this.register("42[24", (data) => {
        this.emitter.emit("C_PLAYER_LEFT_TYPES", {
        type: data[2] ? 1 : 2,
        user: this.roomSettings.users[data[1]] ,
        sendMessage: (text) => this.methods.sendMessage(text),
        getUserHost: this.methods.getUserHost.bind(this.methods),
        getUsers: this.methods.getUsers.bind(this.methods),
      });
    delete this.roomSettings.users[data[1]]  
})
    
    //quando alguem sai da sala
    this.register("42[5", (data) => {
        this.emitter.emit("C_PLAYER_LEFT_TYPES", {
        type:0,
        user: this.roomSettings.users[data[1]] ,
        sendMessage: (text) => this.methods.sendMessage(text),
        getUserHost: this.methods.getUserHost.bind(this.methods),
        getUsers: this.methods.getUsers.bind(this.methods),
      });
    delete this.roomSettings.users[data[1]]  
})

 
    //quando usuario entra na sala
    this.register("42[4", (data) => {
      this.methods.sendactuallyMapToClient(data);
      const user = {
        peerID: data[2],
        userName: data[3],
        guest: data[4],
        team: data[6],
        level: data[5],
        ready: false,
        tabbed: false,
        avatar: data[7],
      };
      this.roomSettings.users[data[1]] = user;
      //       if (
      //         this.client.adminAccounts &&
      //         this.client.adminAccounts.has(user.userName)
      //       ) {
      //         this.adminUsers[data[1]] = 2;
      //       }

      this.emitter.emit("C_PLAYER_JOIN", {
        user,
        sendMessage: (text) => this.methods.sendMessage(text),
        getUserHost: this.methods.getUserHost.bind(this.methods),
        getUsers: this.methods.getUsers.bind(this.methods),
      });
      
      this.logger?.log?.("INFO", `JOGADOR ${data[3]} ENTROU NA SALA`);
    });

    //quando recebe mensagem
    this.register("42[20", (data) => {
      if (data[1] == this.state.botId) return;

      const message = data[data.length - 1];
      const user = this.roomSettings.users[data[1]];

      // if (message.startsWith(this.commandPrefix)) {
      //   const [cmd, ...args] = message.slice(1).split(/ +/);
      //   const commandHandler = this.commands.get(cmd.toLowerCase());
      //   if (commandHandler) commandHandler(data[1], args);
      // } else {
      this.emitter.emit("C_BONK_MESSAGE", {
        user: user.userName,
        message: message,
    sendMessage: (text) => this.methods.sendMessage(text),
        getUserHost: this.methods.getUserHost.bind(this.methods),
        getUsers: this.methods.getUsers.bind(this.methods),
      });
      // }
    });
  }
  /*
  initAdminCommands() {
    this.registerCommand("auth", (userId) => {
      const user = this.state.users[userId];
      if (!user) {
        this.sendMessage(userId, "❌ Usuário não encontrado!");
        return;
      }

      if (this.client.adminAccounts && this.client.adminAccounts.has(user.userName)) {
        this.adminUsers[userId] = 2;
        this.sendMessage( `✅ Autenticado como admin!`);
      } else {
        this.sendMessage(`❌ Acesso negado!`);
      }
    }, 0);

    this.registerCommand("setrounds", (userId, args) => {
      if (!this.isAdmin(userId, 2)) {
        this.sendMessage(`❌ Você precisa ser admin!`);
        return;
      }

      if (!args[0] || isNaN(args[0])) {
        this.sendMessage(`❌ Uso: !setrounds [número]`);
        return;
      }

      const rounds = parseInt(args[0]);
      if (rounds < 1 || rounds > 999) {
        this.sendMessage(`❌ Número deve ser entre 1 e 99`);
        return;
      }

      this.roomSettings.rounds = rounds;
      this.send(`42[21,{"w":${rounds}}]`);
      this.sendMessage(`✅ Rodadas setadas para ${rounds}`);
    }, 2);

    this.registerCommand("rounds", (userId) => {
      this.sendMessage(`🔄 Rodadas atuais: ${this.roomSettings.rounds}`);
    }, 0);

    this.registerCommand("team", (userId, args) => {
      if (!this.isAdmin(userId, 1)) return;
      
      const action = args[0]?.toLowerCase();
      if (action === "on") {
        this.roomSettings.teamsEnabled = true;
        this.send(`42[32,{"t":true}]`);
        this.sendMessage("✅ Times ativados!");
      } else if (action === "off") {
        this.roomSettings.teamsEnabled = false;
        this.send(`42[32,{"t":false}]`);
        this.sendMessage("✅ Times desativados!");
      } else {
        this.sendMessage(`❌ Uso: !teams [on/off]`);
      }
    }, 1);

    this.registerCommand("lockteams", (userId) => {
      if (!this.isAdmin(userId, 1)) return;
      
      this.roomSettings.teamsLocked = true;
      this.send(`42[7,{"teamLock":true}]`);
      this.sendMessage("🔒 Times travados!");
    }, 1);

    this.registerCommand("unlockteams", (userId) => {
      if (!this.isAdmin(userId, 1)) return;
      
      this.roomSettings.teamsLocked = false;
      this.send(`42[7,{"teamLock":false}]`);
      this.sendMessage("🔓 Times destravados!");
    }, 1);

    this.registerCommand("kick", (userId, args) => {
      if (!this.isAdmin(userId, 1)) {
        this.sendMessage(`❌ Você precisa ser admin!`);
        return;
      }

      if (!args[0]) {
        this.sendMessage(`❌ Uso: !kick [nome]`);
        return;
      }

      const targetId = this.findUserId(args[0]);
      if (!targetId) {
        this.sendMessage(`❌ Jogador não encontrado!`);
        return;
      }

      this.send(`42[9,{"banshortid":${targetId},"kickonly":true}]`);
      this.sendMessage(`👢 ${this.state.users[targetId].userName} foi kickado!`);
    }, 1);

    this.registerCommand("ban", (userId, args) => {
      if (!this.isAdmin(userId, 2)) {
        this.sendMessage(`❌ Você precisa ser admin nível 2!`);
        return;
      }

      if (!args[0]) {
        this.sendMessage(`❌ Uso: !ban [nome]`);
        return;
      }

      const targetId = this.findUserId(args[0]);
      if (!targetId) {
        this.sendMessage(`❌ Jogador não encontrado!`);
        return;
      }

      this.send(`42[9,{"banshortid":${targetId},"kickonly":false}]`);
      this.sendMessage(`🚨 ${this.state.users[targetId].userName} foi banido!`);
    }, 2);

    this.registerCommand("start", (userId) => {
      if (!this.isAdmin(userId, 1)) return;
      
      this.send(`42[36,{"num":1}]`);
      this.sendMessage("🎮 Jogo iniciado!");
    }, 1);

    this.registerCommand("stop", (userId) => {
      if (!this.isAdmin(userId, 2)) return;
      
      this.send(`42[36,{"num":0}]`);
      this.sendMessage("⏹ Jogo parado!");
    }, 2);

    this.registerCommand("admins", (userId) => {
      const activeAdmins = Object.entries(this.adminUsers)
        .filter(([id]) => this.state.users[id])
        .map(([id, level]) => `${this.state.users[id].userName} (nível ${level})`);
      
      const configAdmins = this.client.adminAccounts ? Array.from(this.client.adminAccounts) : [];
      
      this.sendMessage(`👑 Admins ativos: ${activeAdmins.join(", ") || "Nenhum"}`);
      this.sendMessage(`📋 Admins configurados: ${configAdmins.join(", ") || "Nenhum"}`);
    }, 0);

    this.registerCommand("settings", (userId) => {
      this.sendMessage(`⚙️ Configurações atuais:
🔄 Rodadas: ${this.roomSettings.rounds}
${this.roomSettings.teamsEnabled ? '✅' : '❌'} Times ativados
${this.roomSettings.teamsLocked ? '🔒' : '🔓'} Times travados
${this.roomSettings.roomLocked ? '🔒' : '🔓'} Sala trancada`);
    }, 0);
  }

  initMinigameCommands() {
    // Comando para listar minigames disponíveis
    this.registerCommand("games", (userId) => {
      this.sendMessage(`🎮 Minigames disponíveis:
!russian - Roleta Russa (1/6 chance de perder)
!bet [valor] - Aposta em um número (1-6)`);
    }, 0);

    // Roleta Russa
    this.registerCommand("roletarussa", (userId) => {
      if (this.minigames.active && this.minigames.currentGame !== "roletarussa") {
        this.sendMessage(`❌ Já há um minigame em andamento!`);
        return;
      }

      if (this.minigames.cooldowns[userId] && Date.now() < this.minigames.cooldowns[userId]) {
        const remaining = Math.ceil((this.minigames.cooldowns[userId] - Date.now()) / 1000);
        this.sendMessage(`❌ Aguarde ${remaining} segundos para jogar novamente!`);
        return;
      }

      this.minigames.active = true;
      this.minigames.currentGame = "rr";
      
      const bullet = Math.floor(Math.random() * 6) + 1;
      const result = bullet === 1 ? "💥 BOOM! Você perdeu!" : "🔫 Click! Você sobreviveu!";
      
      this.sendMessage(`🎲 ${this.state.users[userId].userName} jogou roleta russa... ${result}`);
      
      if (bullet === 1) {
        this.send(`42[9,{"banshortid":${userId},"kickonly":true}]`);
      }

      this.minigames.cooldowns[userId] = Date.now() + 3000; // 3s de cooldown
      this.minigames.active = false;
    }, 0);

       this.registerCommand("rr", (userId) => {
      if (this.minigames.active && this.minigames.currentGame !== "rr") {
        this.sendMessage(`❌ Já há um minigame em andamento!`);
        return;
      }

      if (this.minigames.cooldowns[userId] && Date.now() < this.minigames.cooldowns[userId]) {
        const remaining = Math.ceil((this.minigames.cooldowns[userId] - Date.now()) / 1000);
        this.sendMessage(`❌ Aguarde ${remaining} segundos para jogar novamente!`);
        return;
      }

      this.minigames.active = true;
      this.minigames.currentGame = "rr";
      
      const bullet = Math.floor(Math.random() * 6) + 1;
      const result = bullet === 1 ? "💥 BOOM! Você perdeu!" : "🔫 Click! Você sobreviveu!";
      
      this.sendMessage(`🎲 ${this.state.users[userId].userName} jogou roleta russa... ${result}`);
      
      if (bullet === 1) {
        this.send(`42[9,{"banshortid":${userId},"kickonly":true}]`);
      }

      this.minigames.cooldowns[userId] = Date.now() + 3000; // 3s de cooldown
      this.minigames.active = false;
    }, 0);

    // Betting Game
    this.registerCommand("bet", (userId, args) => {
      if (this.minigames.active && this.minigames.currentGame !== "bet") {
        this.sendMessage(`❌ Já há um minigame em andamento!`);
        return;
      }

      if (!args[0] || isNaN(args[0])) {
        this.sendMessage(`❌ Uso: !bet [valor entre 1-100]`);
        return;
      }

      const betAmount = parseInt(args[0]);
      if (betAmount < 1 || betAmount > 100) {
        this.sendMessage(`❌ Aposta deve ser entre 1-100!`);
        return;
      }

      const chosenNumber = Math.floor(Math.random() * 6) + 1;
      const winningNumber = Math.floor(Math.random() * 6) + 1;
      
      if (chosenNumber === winningNumber) {
        const winAmount = betAmount * 5;
        this.sendMessage(`🎰 ${this.state.users[userId].userName} apostou ${betAmount} e ganhou ${winAmount}! Número sorteado: ${winningNumber}`);
      } else {
        this.sendMessage(`🎰 ${this.state.users[userId].userName} apostou ${betAmount} e perdeu! Número sorteado: ${winningNumber} (seu número: ${chosenNumber})`);
      }
    }, 0);
  }

  registerCommand(name, handler, minLevel = 0) {
    this.commands.set(name.toLowerCase(), (userId, args) => {
      if (this.isAdmin(userId, minLevel)) {
        handler(userId, args);
      } else {
        this.sendMessage(`❌ Sem permissão!`);
      }
    });
  }

  isAdmin(userId, requiredLevel = 1) {
    if (userId === this.state.hostId) return true;
    return (this.adminUsers[userId] || 0) >= requiredLevel;
  }

  findUserId(username) {
    return Object.keys(this.state.users).find(
      id => this.state.users[id].userName.toLowerCase() === username.toLowerCase()
    );
  }
*/
 

  register(command, handler) {
    this.handlers.set(command, handler);
  }
  execute(command, data) {
    const handler = this.handlers.get(command);
    if (handler) handler(data);
    else this.logger?.log("WARN", `Handler não encontrado: ${command}`);
  }
}

module.exports = Receives;
