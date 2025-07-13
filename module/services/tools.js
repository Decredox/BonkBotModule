const axios = require("axios");

const TOOLS = (logger) => ({
	api: axios.create({
		baseURL: "https://bonk2.io/scripts/",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		}
	}),

	p(data){
		return new URLSearchParams(data).toString();
	},
	 async post(endpoint, data){
		try {
			const res = await this.api.post(endpoint, this.p(data));
			return res.data;
		} catch (error) {
			logger.log(
				"ERROR",
				`[BonkTools] Erro em POST(${endpoint}): ${
            error?.response?.data || error.message
          }`
			);
			throw error;
		}
	},
	async get(endpoint) {
		try {
			const res = await this.api.get(endpoint);
			return res.data;
		} catch (error) {
			logger.log(
				"ERROR",
				`[BonkTools] Erro em GET(${endpoint}): ${
          error?.response?.data || error.message
        }`
			);
			throw error;
		}
	},
	login(username, password) {
		return this.post("login_legacy.php", {
			username,
			password,
			remember: true,
		});
	},
	// Rooms
	getAllRooms(token, gl = "y", version = "49") {
		return this.post("getrooms.php", {
			version,
			gl,
			token
		});
	},

	getRoomInfo: (roomId, g = "n") => {
		return this.post("getroomaddress.php", {
			id: roomId,
			g
		});
	},

	getDataFromLink(joinID) {
		return this.post("autojoin.php", {
			joinID
		});
	},

  generatePeerId() {
    return Math.random().toString(36).substr(2, 10) + "v00000";
  }
})


  // autoLogin(rememberToken) {
  //   return this.post("login_auto.php", { rememberToken });
  // }

  // clearAutoLogin(rememberToken) {
  //   return this.post("login_clearauto.php", { rememberToken });
  // }

  // register(username, password) {
  //   return this.post("register_legacy.php", {
  //     username,
  //     password,
  //     remember: true,
  //   });
  // }

  

  // Friends
  // getFriends(token) {
  //   return this.post("friends.php", { token, task: "getfriends" });
  // }

  // addFriend(token, friendName) {
  //   return this.post("friends.php", {
  //     token,
  //     task: "send",
  //     tatheirnamesk: friendName,
  //   });
  // }

  // Avatar
  // saveSkin(token, slot, skinData) {
  //   return this.post("avatar_update.php", {
  //     token,
  //     task: "updateavatar",
  //     newavatarslot: slot,
  //     newavatar: skinData,
  //   });
  // }

  // updateSkinSlot(token, slot) {
  //   return this.post("avatar_update.php", {
  //     token,
  //     task: "updateslot",
  //     newactive: slot,
  //   });
  // }

  // // Replays
  // getReplays(offset = 0, startingFrom = "") {
  //   return this.post("replay_get.php", {
  //     version: "49",
  //     offset,
  //     startingFrom,
  //   });
  // }

//   // Player count
//   getOnlinePlayers() {
//     return this.get("combinedplayercount.txt");
//   }

  //   generatePeerId() {
  //   return Math.random().toString(36).substr(2, 10) + "v00000";
  // }


// }

module.exports = TOOLS;
