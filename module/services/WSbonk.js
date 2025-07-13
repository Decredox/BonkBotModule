const WebSocket = require("ws");
// const EventEmitter = require("events");
const receives = require("./events/receives.js");
class WEBSOCKET {
  constructor(wsID, server, roomData, logger, emitter,admins) {
    this.server = {wsID, server};
    this.roomData = roomData;
    this.ws = null;
    this.receives = null;
    this.ping = null;
    this.logger = logger;
    this.emitter = emitter;
    this.admins = admins;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `wss://${this.server.server}.bonk.io/socket.io/?EIO=3&transport=websocket`,
        {
          headers: {
            Origin: "https://bonk.io",
            Referer: "https://bonk.io/",
            "User-Agent": "Mozilla/5.0",
          },
        }
      );

      this.ws.on("open", () => {
        this.send(`42[13, ${JSON.stringify(this.roomData)}]`);
        this.receives = new receives({
          server: this.server,
          ws: this.ws,
          send: this.send.bind(this),
          disconnect: this.disconnect.bind(this),
          logger: this.logger,
          emitter: this.emitter,
          admins: this.admins,
        });
  
   

  
        this.ping = setInterval(() => {
          this.send(40)
        }, 10000);
        this.logger.log("INFO", "[BonkWebSocket] Conectado com sucesso!");
        resolve();
      });

      this.ws.on("message", (data) => {
        const messageStr = data.toString().trim();
        if (!/^\d+\[(\d+),(.*)\]$/s.test(messageStr)) return;

        try {
          const payload = JSON.parse(messageStr.replace(/^[^\[]*\[/, "["));
          const matchCMD = messageStr.match(/^(\d+\[\d+)/);
          const command = matchCMD ? matchCMD[1] : null;
          // console.log(messageStr);
          if (command) this.receives.execute(command, payload);
          // else this.logger.log("WARN", `Handler desconhecido: ${messageStr}`);
        } catch (e) {
          this.logger.log("ERROR", `Erro ao processar mensagem: ${e.message}`);
        }
      });

      this.ws.on("close", () => {
        if (this.ping) clearInterval(this.ping);
        this.logger.log("WARN", "Conexão WebSocket fechada.");
      });

      this.ws.on("error", (err) => {
        this.logger.log("ERROR", `Erro WebSocket: ${err}`);
        reject(err);
      });
    });
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.logger.log("WARN", "WebSocket não está conectado.");
    }
  }

  disconnect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

module.exports = WEBSOCKET;
