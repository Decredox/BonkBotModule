class Commands {
  constructor({ wsId, ws, send, disconnect, emitter }) {
    this.wsId = wsId;
    this.ws = ws;
    this.send = send;
    this.disconnect = disconnect;
    this.emitter = emitter;

    this.state = {
      myId: undefined,
      roomId: undefined,
      users: [],
    };

    this.handlers = new Map();

    this.register("42[49", (data) => {
      const room = data[1] + data[2];
      const paddedRoom = room.padStart(6, "0");
      this.state.roomId = paddedRoom;
      this.emitter?.emit("roomIdSet", paddedRoom);
    });

    this.register("42[3", (data) => {
      this.state.myId = data[1];
      this.state.users = data[3].filter(Boolean).map((user) => ({
        username: user.userName.toLowerCase(),
        avatar: user.avatar,
      }));
      this.emitter?.emit("usersUpdated", this.state.users);
    });

    this.register("42[4", (data) => {
      const username = data[3].toLowerCase();
      const avatar = data.at(-1);
      const index = this.state.users.findIndex((u) => u.username === username);
      if (index !== -1) {
        this.state.users[index].avatar = avatar;
      } else {
        this.state.users.push({ username, avatar });
      }
      this.emitter?.emit("avatarUpdated", { username, avatar });
    });

    this.register("42[20", (data) => {
      if (data[1] !== this.state.myId) return;
      this.emitter.emit("MESSAGE", data);
    });
  }

  register(command, handler) {
    if (this.handlers.has(command)) {
      throw new Error(`[HandlerCommand] Comando "${command}" já existe.`);
    }
    this.handlers.set(command, handler);
  }

  execute(command, data) {
    if (!this.handlers.has(command)) {
      console.warn(`[HandlerCommand] Nenhum comando "${command}" encontrado.`);
      return;
    }
    this.handlers.get(command)(data);
  }

  getState() {
    return this.state;
  }
}

module.exports = Commands;
