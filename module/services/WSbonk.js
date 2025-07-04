const WebSocket = require("ws");
const EventEmitter = require("events");
const Commands = require("./Commands.js");
class WEBSOCKET {
  constructor(wsID, server, roomData) {
    // super();
    this.wsID = wsID;
    this.server = server;
    this.roomData = roomData;
    this.ws = null;
    this.commands = null;
    this.ping = null;
    this.emitter = new EventEmitter();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `wss://${this.server}.bonk.io/socket.io/?EIO=3&transport=websocket`,
        {
          headers: {
            Origin: "https://bonk.io",
            Referer: "https://bonk.io/",
            "User-Agent": "Mozilla/5.0",
          },
        }
      );
      this.ws.on("open", () => {
        this.send = (msg) => this.ws.send(msg);
        this.disconnect = () => this.ws.close();

        this.commands = new Commands({
          wsId: this.wsID,
          ws: this.ws,
          send: this.send.bind(this),
          disconnect: this.disconnect,
          emitter: this.emitter,
        });

        this.send(`42[13, ${JSON.stringify(this.roomData)}]`);
        this.send(`42[44,{"out":true}]`);

        this.ping = setInterval(() => {
          this.send(40);
        }, 10000);
        console.log("[BonkWebSocket] Conectado com sucesso!");
      });

      this.ws.on("message", (data) => {
        const messageStr = data.toString().trim();
        // if (messageStr.startsWith('{')) return;
        console.log("[BonkWebSocket] Mensagem recebida: ", messageStr);
        if (!/^\d+\[(\d+),(.*)\]$/s.test(messageStr)) return;

        let payload = JSON.parse(messageStr.replace(/^[^\[]*\[/, "["));
        // console.log("[BonkWebSocket] Mensagem recebida:", payload);

        const matchCMD = messageStr.match(/^(\d+\[\d+)/);
        const command = matchCMD ? matchCMD[1] : null;
        console.log("COMANDOO: ", command);
        if (command) {
          this.commands.execute(command, payload);
        } else {
          console.warn("Comando desconhecido:", messageStr);
        }
      });

      this.ws.on("close", () => {
        if (this.ping) clearInterval(this.ping);
        console.log("[BonkWebSocket] Conexão WebSocket fechada.");
      });

      this.ws.on("error", (err) => {
        console.error("[BonkWebSocket] Erro WebSocket:", err);
        reject(err);
      });
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn("[BonkWebSocket] WebSocket não está conectado.");
    }
  }

  disconnect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

module.exports = WEBSOCKET;
