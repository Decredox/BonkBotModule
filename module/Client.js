const tools = require("./services/tools.js");
const ws = require("./services/WSbonk.js");
const EventEmitter = require("events");
const LOGGER = require("./services/logger.js");
const payloaders = require("./services/payloaders.js");
class BonkClient extends EventEmitter {
  constructor() {
    super();
    this.WS = ws;
    this.client = {};
    this.servers = [];
    this.count = 0;
    this.logger = LOGGER({ logLevel: "INFO" });
    this.TOOL = undefined;
    this.logged = false;
    this.admins = new Set();
  }

async auth(bclient = {}) {
  if (this.logged) {
    this.logger?.log?.("WARN", "Apenas um usuário por Client!");
    return;
  }


  if (bclient?.config?.LOG_LEVELS !== undefined) {
    const level = bclient.config?.LOG_LEVELS;
    this.logger = new LOGGER({ logLevel: level });
  }
  
this.TOOL = tools(this.logger);
  const {
    username = "BOT",
    password,
    avatar = { layers: [], bc: 4492031 },
  } = bclient;

  try {
  
    if (!password) {
      this.client = payloaders({
        guestName: username,
        avatar,
        guest: true,
        version: 49,
      }, this.TOOL);
    } else {
      const res =
        await this.TOOL.login(username, password);
     if(res.r == "fail"){
      throw new Error(res.e);
     }
        this.client = payloaders({
        token:res.token,
        username: res.userName,
        avatar,
        guest: false,
        version: 49,
      }, this.TOOL);
    }

    this.logged = true;
    this.logger.log("INFO", "[BonkClient] Usuário autenticado com sucesso!");

  
    this.emit("ready", {
      setAdressByUrl: this.setAdressByUrl.bind(this),
      setAdressByName: this.setAdressByName.bind(this),
      connect: this.connect.bind(this),
    });
  } catch (err) {
    this.logger.log("ERROR", `[BonkClient] Erro de login: ${err.message}`);
    throw err; 
  }
}


  async connect(room) {
    try {
      if (!room) {
        throw new Error("[BonkClient] Nenhuma sala inserida!");
      }
      const count = this.count++;
      const wsInstance = new this.WS(
        count,
        room.server,
        room.payload,
        this.logger,
        this,
        this.admins
      );

      //EVENTS
      wsInstance.emitter.on("C_BONK_MESSAGE", (ctx) => {
        this.emit("bonk_chat_message", ctx);
      });
      wsInstance.emitter.on("C_PLAYER_JOIN", (ctx) => {
        this.emit("bonk_player_join", ctx);
      });
            wsInstance.emitter.on("C_PLAYER_LEFT", (ctx) => {
        this.emit("bonk_player_left", ctx);
      });


      const exitTypes = {
  0: (emitter, ctx) => emitter.emit("bonk_player_left", ctx),
  1: (emitter, ctx) => emitter.emit("bonk_player_kicked", ctx),
  2: (emitter, ctx) => emitter.emit("bonk_player_banned", ctx),
};

wsInstance.emitter.on("C_PLAYER_LEFT_TYPES", (ctx) => {
  const fn = exitTypes[ctx.type];
    delete ctx.type;
    fn(wsInstance.emitter, ctx);
});



      this.servers.push({ id: count, s: wsInstance });
      await wsInstance.connect();

      return wsInstance;
    } catch (e) {
      this.logger.log("ERROR", `Erro ao conectar ao websocket: ${e.message}`);
      throw e;
    }
  }

  async setAdressByUrl(roomLink) {
    try {
      const regex =
        /(?:https?:\/\/)?bonk\.io\/(?:#?)([a-zA-Z0-9]{6,})|\b([a-zA-Z0-9]{6,})\b/;
      const match = roomLink.match(regex);
      const code = match ? match[1] || match[2] : null;

      if (!code) {
        throw new Error(
          `[BonkClient] Formato de URL inválido: "${roomLink}". Use "bonk.io/CODE" ou apenas "CODE"`
        );
      }

      const server = await this.TOOL.getDataFromLink(code);
      if (!server || server.error || server.r == "failed") {
        throw new Error(
          server?.error ||
            `[BonkClient] Sala ${code} não encontrada ou inacessível`
        );
      }

      this.logger.log("INFO", `[BonkClient] Sala encontrada: ${code}`);
      return this.client.joinServerPayload(server.address, server.server);
    } catch (e) {
      this.logger.log("WARN", `[BonkClient] Erro na conexão: ${e.message}`);
      throw e;
    }
  }

  async setAdressByName(roomName) {
    try {
      this.logger.log("INFO", `Buscando sala por nome: "${roomName}"`);
      const rooms = await this.TOOL.getAllRooms(this.client.token);
      if (!rooms || rooms.error) {
        throw new Error(rooms?.error || "Erro ao buscar lista de salas");
      }

      const matches = rooms.rooms?.filter(
        (r) => r.roomname?.toLowerCase() === roomName.toLowerCase()
      );
      if (!matches || matches.length === 0) {
        throw new Error(`Nenhuma sala encontrada com o nome "${roomName}"`);
      }

      const selectedRoom = matches[0];
      this.logger.log(
        "INFO",
        `[BonkClient] Sala encontrada - ID: ${selectedRoom.id}, Nome: "${selectedRoom.roomname}"`
      );

      const server = await this.TOOL.getRoomInfo(selectedRoom.id);
      if (!server || server.error) {
        throw new Error(server?.error || "Erro ao obter informações da sala");
      }

      this.logger.log(
        "INFO",
        `[BonkClient] Sala encontrada: "${roomName}" (ID: ${selectedRoom.id})`
      );
      return this.client.joinServerPayload(server.address, server.server);
    } catch (e) {
      this.logger.log(
        "WARN",
        `[BonkClient] Erro ao buscar por nome: ${e.message}`
      );
      throw e;
    }
  }

  //ADMINS
  addAdminsAccounts(...usernames) {
    if (arguments.length == 0) return this.logger.log("ERROR","[Admin] Nenhuma conta passada como parametro");
     for(const username of usernames){
      if(typeof username !== "string" && !username.trim()) return false;
      this.admins.add(username.trim());
      this.logger.log("INFO", `[Admin] Conta Adicionada: ${username}`);
     }
      return this.logger.log("INFO", `[Admin] Contas Adicionadas com exito`)
  }

  

  removeAdminAccount(username) {
    if (typeof username === 'string' && username.trim()) {
      const result = this.admins.delete(username.trim());
      if (result) {
        this.logger.log("INFO", `[Admin] Conta removida: ${username}`);
      }
      return true;
    }
    return false;
  }



     listAdminAccounts() {
       return Array.from(this.admins);
     }



  static validateToken(fn) {
    return async function (...args) {
      if (!this.client?.token) {
        this.logger?.log("WARN", "Token ausente. Operação abortada.");
        return;
      }
      return await fn.apply(this, args);
    };
  }
}

// BonkClient.prototype.setAdressByUrl = BonkClient.validateToken(
//   BonkClient.prototype.setAdressByUrl
// );
// BonkClient.prototype.setAdressByName = BonkClient.validateToken(
//   BonkClient.prototype.setAdressByName
// );
// BonkClient.prototype.connect = BonkClient.validateToken(
//   BonkClient.prototype.connect
// );

module.exports = BonkClient;
