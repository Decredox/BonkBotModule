const tools = require("./services/tools.js");
const ws = require("./services/WSbonk.js");
const EventEmitter = require("events");

function validateToken(fn) {
  return async function (...args) {
    if (!this.client.token) {
      console.warn("Token ausente. Operação abortada.");
      return;
    }
    return await fn.apply(this, args);
  };
}

class bonkClient extends EventEmitter {
  constructor() {
    super();
    this.TOOL = tools;
    this.WS = ws;
    this.client = {};
    this.servers = [];
    this.count = 0;
  }

  async login(bclient) {
    try {
      const res = await this.TOOL.login(bclient.username, bclient.password);
      this.client = {
        token: res.token,
        username: res.username,
        avatar: bclient.avatar || { layers: [], bc: 4492031 },
        guest: false,
        version: 49,
      };
      console.log("[BonkClient] Usuário autenticado com sucesso");

      this.emit("ready", {
        setAdressByUrl: this.setAdressByUrl.bind(this),
        setAdressByName: this.setAdressByName.bind(this),
        connect: this.connect.bind(this),
      });
    } catch (e) {
      console.error("[BonkClient] Erro de login:", e.message);
      throw e;
    }
  }

  _createServerPayload(serverAddress, server) {
    const payload = {
      ...this.client,
      bypass: "",
      joinID: serverAddress,
      dbid: 2,
      roomPassword: "",
      peerID: this.TOOL.generatePeerId(),
    };
    delete payload.username;
    return { server, payload };
  }

  async connect(room) {
    try {
      if (!room) {
        throw new Error("Nenhuma sala inserida!");
      }
      const count = this.count++;
      const wsInstance = new this.WS(count, room.server, room.payload);

      //event

      wsInstance.emitter.on("bonk_chat_message", (msg) => {
        this.emit("bonk_chat_message", msg);
      });

      this.servers.push({ id: count, s: wsInstance });
      await wsInstance.connect();

      return wsInstance;
    } catch (e) {
      console.error("Erro ao conectar ao websocket:", e.message);
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
      console.log(`[BonkClient] Sala encontrada: ${code}`);
      const payload = this._createServerPayload(server.address, server.server);

      return payload;
    } catch (e) {
      console.error("[BonkClient] Erro na conexão:", e.message);
      throw e;
    }
  }

  async setAdressByName(roomName) {
    try {
      console.log(`🔍 Buscando sala por nome: "${roomName}"`);
      const rooms = await this.TOOL.getAllRooms(this.client.token);
      if (!rooms || rooms.error) {
        throw new Error(
          rooms?.error || "[BonkClient] Erro ao buscar lista de salas"
        );
      }

      const matches = rooms.rooms?.filter(
        (r) => r.roomname?.toLowerCase() === roomName.toLowerCase()
      );
      if (!matches || matches.length === 0) {
        throw new Error(
          `[BonkClient] Nenhuma sala encontrada com o nome "${roomName}"`
        );
      }

      const selectedRoom = matches[0];
      console.log(
        `[BonkClient]  Sala encontrada - ID: ${selectedRoom.id}, Nome: "${selectedRoom.roomname}"`
      );

      const server = await this.TOOL.getRoomInfo(selectedRoom.id);
      if (!server || server.error) {
        throw new Error(
          server?.error || "[BonkClient] Erro ao obter informações da sala"
        );
      }

      const payload = this._createServerPayload(server.address, server.server);
      console.log(
        `[BonkClient] Sala encontrada: "${roomName}" (ID: ${selectedRoom.id})`
      );
      return payload;
    } catch (e) {
      console.error("[BonkClient] Erro ao buscar por nome:", e.message);
      throw e;
    }
  }
}

bonkClient.prototype.setAdressByUrl = validateToken(
  bonkClient.prototype.setAdressByUrl
);
bonkClient.prototype.setAdressByName = validateToken(
  bonkClient.prototype.setAdressByName
);
bonkClient.prototype.connect = validateToken(bonkClient.prototype.connect);
module.exports = bonkClient;
