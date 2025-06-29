const API = require("./utils/bonkApi.js");
const EventEmitter = require("events");

// Função para validar token
function v(f) {
  return async function(...args) {
    if (!this.token) {
      console.warn("Token ausente. Operação abortada.");
      return;
    }
    return await f.apply(this, args);
  }
}

class bonkClient extends EventEmitter {
  constructor() {
    super();
    this.API = API;
    this.token = null;
    this.username = null;
    this.servers = [];
  }

  async login(client) {
    try {
      const res = await this.API.login(client.username, client.password);
      this.token = res.token;
      this.username = client.username;
      console.log("Usuário autenticado com sucesso");
      this.emit("ready", {
        setAdressByUrl: this.setAdressByUrl.bind(this),
        setAdressByName: this.setAdressByName.bind(this),
      });
    } catch (error) {
      console.error("Erro de login:", error.message);
      throw error;
    }
  }

  async setAdressByUrl(roomLink) {
    try {
      const regex = /(?:https?:\/\/)?bonk\.io\/(?:#?)([a-zA-Z0-9]{6,})|\b([a-zA-Z0-9]{6,})\b/;
      const match = roomLink.match(regex);
      const code = match ? match[1] || match[2] : null;

      if (!code) {
        throw new Error(`Formato de URL inválido: "${roomLink}". Use "bonk.io/CODE" ou apenas "CODE"`);
      }

      console.log(`Conectando à sala: ${code}`);
      const server = await this.API.getDataFromLink(code);
      
      if (!server || server.error) {
        throw new Error(server?.error || `Sala ${code} não encontrada ou inacessível`);
      }

      this.servers.push(server);
      console.log(`Conexão estabelecida com a sala: ${code}`);
      return server;
    } catch (e) {
      console.error("Erro na conexão:", e.message);
      throw e;
    }
  }

  async setAdressByName(roomName) {
    try {
      console.log(`Buscando sala por nome: "${roomName}"`);
      let rooms = await this.API.getAllRooms(this.token);
      
      if (!rooms || rooms.error) {
        throw new Error(rooms?.error || "Erro ao buscar lista de salas");
      }

      const matches = rooms.rooms?.filter(r => 
        r.roomname?.toLowerCase() === roomName.toLowerCase()
      );

      if (!matches || matches.length === 0) {
        throw new Error(`Nenhuma sala encontrada com o nome "${roomName}"`);
      }

      const selectedRoom = matches[0];
      console.log(`Sala encontrada - ID: ${selectedRoom.id}, Nome: "${selectedRoom.roomname}"`);
      
      const server = await this.API.getRoomInfo(selectedRoom.id);
      if (!server || server.error) {
        throw new Error(server?.error || "Erro ao obter informações da sala");
      }

      this.servers.push(server);
      console.log(`Conectado com sucesso à sala "${roomName}" (ID: ${selectedRoom.id})`);
      return server;
    } catch (e) {
      console.error("Erro ao buscar por nome:", e.message);
      throw e;
    }
  }
}

// Aplica validação de token
bonkClient.prototype.setAdressByUrl = v(bonkClient.prototype.setAdressByUrl);
bonkClient.prototype.setAdressByName = v(bonkClient.prototype.setAdressByName);

module.exports = bonkClient;
