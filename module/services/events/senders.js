const {
   MapCodec,
   SkinCodec
} = require("./codec.js");
class SENDERS {
   constructor(send, roomSettings, state, disconnect, logger) {
      this.send = send;
      this.roomSettings = roomSettings;
      this.state = state;
      this.disconnect = disconnect;
      this.logger = logger;
      this.modes = {
         b: {
            name: "Classic",
            info: ["b", "b"]
         },
         ar: {
            name: "Arrows",
            info: ["b", "ar"]
         },
         ard: {
            name: "Death Arrows",
            info: ["b", "ard"]
         },
         sp: {
            name: "Grapple",
            info: ["b", "sp"]
         },
         v: {
            name: "VTOL",
            info: ["b", "v"]
         },
         f: {
            name: "Futebol",
            info: ["f", "f"]
         },
      };
      this.validate = {
         isNumber: (v) => typeof v === "number" && Number.isFinite(v),
         isString: (v) => typeof v === "string" && v.trim().length > 0,
      };
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



   //normal actions
   sendMessage(text) {
      if (text.length == 0)
         return this.logger.log("ERROR", "Campo de menssagem vazio!");
      if (this.validate.isNumber(text))
         return this.logger.log("ERROR", "Apenas strings sao aceitas!");
      this.send(`42[10,{"message":"${text}"}]`);
   }

   joinTeam(num) {
      if (this.validate.isString(num))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");
      if (num < 0 || num > 5)
         return this.logger.log("ERROR", "Times apenas entre 0 e 5!");
      if (this.roomSettings.teamLocked)
         return this.logger.log("ERROR", "Times esta fechado!");
      this.state.team = num;
      this.send(`42[6,{"targetTeam":${num}}]`);
   }

   setTab(cond) {
      if (typeof cond !== "boolean")
         return this.logger.log("ERROR", "Apenas valores boleanos!");
      this.send(`42[44,{"out":${cond}}]`);
   }

   //hosts Actions

      sendactuallyMapToClient(data) {
        
           if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (this.validate.isNumber(mode))
         return this.logger.log("ERROR", "Apenas strings sao aceitos!");
      this.send(
         `42[11, ${this.stringifyPayload({
        sid: data[2],
        gs: this.roomSettings.map,
      })}]`,
      );
   }

   setCount(num) {
           if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");

      if (this.validate.isString(num))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");
      if (num <= 1 || num > 3)
         return this.logger.log("ERROR", "Apenas numeros entre 1 e 3!");
      this.send(`42[36, ${this.stringifyPayload({num})}]`);
   }

   giveHost(player_id) {
           if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
    
      if (this.validate.isString(player_id))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");

 
      if (this.roomSettings.users[player_id] == undefined)
         return this.logger.log("ERROR", "Player nao encontrado!");
      this.send(`42[34, ${this.stringifyPayload({id:player_id})}]`);
   }
   teamsLock(lock) {
      if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (typeof lock !== "boolean")
         return this.logger.log("ERROR", "Apenas valores boleanos!");

      this.send(`42[7, ${this.stringifyPayload({teamLock:lock})}]`);
   }

   movePlayer(player_id, team_id) {
         if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (this.validate.isString(player_id) || this.validate.isString(team_id))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");

      if (this.roomSettings.users[player_id] == undefined)
         return this.logger.log("ERROR", "Player nao encontrado!");
      if (num < 0 || num > 5)
         return this.logger.log("ERROR", "Times apenas entre 0 e 5!");
      this.send(`42[26, ${this.stringifyPayload({targetID:player_id, targetTeam: team_id})}]`);
   }

   kickPlayer(player_id) {
         if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (this.validate.isString(player_id))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");
      if (this.roomSettings.users[player_id] == undefined)
         return this.logger.log("ERROR", "Player nao encontrado!");
      this.send(`42[9, ${this.stringifyPayload({banshortid:player_id, kickonly: true})}]`);
   }

   banPlayer(player_id) {

      if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (this.validate.isString(player_id))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");
      if (this.roomSettings.users[player_id] == undefined)
         return this.logger.log("ERROR", "Player nao encontrado!");

      this.send(`42[9, ${this.stringifyPayload({banshortid:player_id, kickonly: false})}]`);
   }

   setPlayerBalance(player_id, bal) {
         if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (this.validate.isString(player_id) || this.validate.isString(bal))
         return this.logger.log("ERROR", "Apenas numbers sao aceitos");
      if (this.roomSettings.users[player_id] == undefined)
         return this.logger.log("ERROR", "Player nao encontrado!");
      if (bal < -100 || bal > 100)
         return this.logger.log(
            "ERROR",
            "Balance apenas valores entre -100 e 100",
         );
         
      this.send(`42[29, ${this.stringifyPayload({sid:player_id, bal})}]`);
   }

   setMode(mode) {
          if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");

      if (this.validate.isNumber(mode))
         return this.logger.log("ERROR", "Apenas strings sao aceitos!");
      const m = this.modes[mode]["info"];
      if (m == undefined) return this.logger.log("ERROR", "Modo Indefinido!");
      
      this.send(`42[20, ${this.stringifyPayload({ga:m[0], mo:m[1]})}]`);
   }

   setMap(map) {
          if (this.roomSettings.hostId !== this.roomSettings.botId)
         return this.logger.log("ERROR", "Apenas host pode user este metodo!");
      if (this.validate.isNumber(map))
         return this.logger.log("ERROR", "Apenas strings sao aceitos!");
      this.send(`42[23, ${this.stringifyPayload({m:map})}]`);
   }

   //receives methods

   getRoomLink() {
      return this.state["admins"];
   }

   getAdmins() {
      return this.state["admins"];
   }
   getHostId() {
      return this.state["hostId"];
   }
   getBotId() {
      return this.state["botId"];
   }
   getBotTeam() {
      return this.state["team"];
   }
   getUserHost() {
      const userHost = this.roomSettings.users[this.state.hostId];
      return this.payload(userHost);
   }

   getUsers() {
      return Object.values(this.roomSettings.users).map((user) =>
         this.payload(user),
      );
   }

   //main functions
   payload(userJson) {
      ["peerID", "avatar"].forEach((key) => delete userJson[key]);
      return userJson;
   }
}

module.exports = SENDERS;