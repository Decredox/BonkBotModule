const WebSocket = require("ws");
const EventEmitter = require("events");
const Commands = require("./Commands.js");
class WEBSOCKET extends EventEmitter {
    constructor(wsID, server, roomData) {
        super();
        this.wsID = wsID;
        this.server = server;
        this.roomData = roomData;
        this.ws = null;
        this.commands = null;
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
                },
            );
            this.ws.on("open", () => {
                this.send = (msg) => this.ws.send(msg);
                this.disconnect = () => this.ws.close();

                this.commands = new Commands({
                    wsId: this.wsID,
                    ws: this.ws,
                    send: this.send,
                    disconnect: this.disconnect,
                    emitter: this,
                });

                console.log("[BonkWebSocket] Conectado com sucesso!");
            });

            this.ws.on("message", (data) => {
                const messageStr = data.toString();
                if (!/^42\[(2|49|20|4|3)/.test(messageStr)) return;
                let payload = JSON.parse(messageStr.replace(/^\\d+/, ""));
                console.log("[BonkWebSocket] Mensagem recebida:", json);

                const match = messageStr.match(/^42\[\d+/);
                const command = match ? match[0] : null;

                if (command) {
                    this.commands.execute(command, payload);
                } else {
                    console.warn("Comando desconhecido:", messageStr);
                }
            });

            this.ws.on("close", () => {
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
