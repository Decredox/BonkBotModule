const axios = require("axios");
const WebSocket = require("ws");

class UTILS {
    constructor() {
        this.api = axios.create({
            baseURL: "https://bonk2.io/scripts/",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
    }

    p(data) {
        return new URLSearchParams(data).toString();
    }

    async post(endpoint, data) {
        try {
            const res = await this.api.post(endpoint, this.p(data));
            return res.data;
        } catch (error) {
            console.error(
                `Erro em POST ${endpoint}:`,
                error?.response?.data || error.message,
            );
            throw error;
        }
    }

    async get(endpoint) {
        try {
            const res = await this.api.get(endpoint);
            return res.data;
        } catch (error) {
            console.error(
                `Erro em GET ${endpoint}:`,
                error?.response?.data || error.message,
            );
            throw error;
        }
    }

    // Auth
    login(username, password) {
        return this.post("login_legacy.php", {
            username,
            password,
            remember: true,
        });
    }

    autoLogin(rememberToken) {
        return this.post("login_auto.php", { rememberToken });
    }

    clearAutoLogin(rememberToken) {
        return this.post("login_clearauto.php", { rememberToken });
    }

    register(username, password) {
        return this.post("register_legacy.php", {
            username,
            password,
            remember: true,
        });
    }

    // Rooms
    getAllRooms(token, gl = "y", version = "49") {
        return this.post("getrooms.php", { version, gl, token });
    }

    getRoomInfo(roomId, g = "n") {
        return this.post("getroomaddress.php", { id: roomId, g });
    }

    getDataFromLink(joinID) {
        return this.post("autojoin.php", { joinID });
    }

    // Friends
    getFriends(token) {
        return this.post("friends.php", { token, task: "getfriends" });
    }

    addFriend(token, friendName) {
        return this.post("friends.php", {
            token,
            task: "send",
            tatheirnamesk: friendName,
        });
    }

    // Avatar
    saveSkin(token, slot, skinData) {
        return this.post("avatar_update.php", {
            token,
            task: "updateavatar",
            newavatarslot: slot,
            newavatar: skinData,
        });
    }

    updateSkinSlot(token, slot) {
        return this.post("avatar_update.php", {
            token,
            task: "updateslot",
            newactive: slot,
        });
    }

    // Replays
    getReplays(offset = 0, startingFrom = "") {
        return this.post("replay_get.php", {
            version: "49",
            offset,
            startingFrom,
        });
    }

    // Player count
    getOnlinePlayers() {
        return this.get("combinedplayercount.txt");
    }

    // Skin encoder (static utility)
    static encodeSkin(d) {
        const h = (x) =>
            Uint8Array.from(x.match(/../g).map((b) => parseInt(b, 16)));
        const a = (b1, b2) => Uint8Array.from([...b1, ...b2]);
        const n = (x) => Uint8Array.of(x & 255);
        const f = (x) => {
            const buffer = new ArrayBuffer(4);
            new DataView(buffer).setFloat32(0, x, false);
            return new Uint8Array(buffer);
        };
        const c = (b, x) => a(b, h("00" + x.toString(16).padStart(6, "0")));
        const e = (b) => Buffer.from(b).toString("base64");

        let b = h("0a070361000209");
        b = a(b, n(d.layers.length * 2 + 1));
        b = a(b, h("010a0705616c000100"));

        for (let l of d.layers) {
            b = a(b, n(l.id));
            b = a(b, f(l.scale));
            b = a(b, f(l.angle));
            b = a(b, f(l.x));
            b = a(b, f(l.y));
            b = a(b, n(+l.flipX));
            b = a(b, n(+l.flipY));
            b = c(b, l.color);
            if (l !== d.layers.at(-1)) b = a(b, h("0a05000100"));
        }

        return e(c(b, d.bc || d.baseColor || 0));
    }

    // Skin decoder (static utility)
    static decodeSkin(s) {
        const b = Uint8Array.from(Buffer.from(s, "base64"));
        const v = new DataView(b.buffer);
        let o = 9,
            r = [],
            c = (x) => (x[0] << 16) | (x[1] << 8) | x[2];
        o += 1 + 11; // skip count + header
        let n = (b[9] - 1) / 2;
        for (let i = 0; i < n; i++) {
            let id = b[o++],
                scale = v.getFloat32(o, false);
            o += 4;
            let angle = v.getFloat32(o, false);
            o += 4;
            let x = v.getFloat32(o, false);
            o += 4;
            let y = v.getFloat32(o, false);
            o += 4;
            let flipX = !!b[o++],
                flipY = !!b[o++],
                col = c(b.slice(o + 1, o + 4));
            o += 4;
            r.push({ id, scale, angle, x, y, flipX, flipY, color: col });
            if (i < n - 1) o += 5;
        }
        let baseColor = c(b.slice(o + 1, o + 4));
        return { layers: r, baseColor };
    }

    //others

    generatePeerId() {
        return Math.random().toString(36).substr(2, 10) + "v00000";
    }
}

class WebSocketManager extends UTILS {
    constructor(server, roomData) {
        super();
        this.server = server;
        this.roomData = roomData;
        this.ws = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(
                `wss://${this.server}.bonk.io/socket.io/?EIO=3&transport=websocket`,
                {
                    headers: {
                        Origin: "https://bonk.io",
                        Referer: "https://bonk.io/",
                        "User-Agent": "Mozilla/5.0", // Exatamente como o site envia
                    },
                },
            );

            this.ws.on("open", () => {
                console.log(
                    "[BonkWebSocket] Conexão WebSocket estabelecida com sucesso!",
                );
                const mensagem = `42[13,${JSON.stringify(this.roomData)}]`;
                this.ws.send(mensagem);
                console.log(
                    "[BonkWebSocket] Dados da sala enviados:",
                    mensagem,
                );
                resolve();
            });

            this.ws.on("message", (data) => {
                console.log(
                    "[BonkWebSocket] Mensagem recebida:",
                    data.toString(),
                );
                if (data.toString() === "40") {
                    console.log(
                        "[BonkWebSocket] Recebido 'ping', respondendo com 'pong'.",
                    );
                    this.ws.send("41");
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

let utils = new UTILS();
module.exports = {
    utils,
    WebSocketManager,
};
