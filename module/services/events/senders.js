const { MapCodec, SkinCodec } = require("./codec.js");
class SENDERS {
  constructor(send, roomSettings, state, disconnect) {
    this.send = send;
    this.roomSettings = roomSettings;
    this.state = state;
    this.disconnect = disconnect;
  }
  stringifyPayload(obj) {
    const ordered = Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});

    return JSON.stringify(ordered);
  }

  //ENCODEMAP
  decodeMap(mapBase64){
    const decodedMap = MapCodec.decodeMap(mapBase64);
    console.log(decodedMap);
  }
  
  //Manda o mapa para o jogador requisitor.
sendactuallyMapToClient(data) {
    this.send(
      `42[11, ${this.stringifyPayload({
        sid: data[1],
        gs: this.roomSettings.map,
      })}]`
    );
  }

  //Manda mensagem no lobby
  sendMessage(text) {
    this.send(`42[10,{"message":"${text}"}]`);
  }

  //other methods
  getUserHost() {
    const userHost = this.roomSettings.users[this.state.hostId];
    return this.payload(userHost);
  }

  getUsers() {
    return Object.values(this.roomSettings.users).map((user) =>
      this.payload(user)
    );
  }

  //main functions
  payload(userJson) {
    ["peerID", "avatar"].forEach((key) => delete userJson[key]);
    return userJson;
  }
}

module.exports = SENDERS;

//emplementar dps...
