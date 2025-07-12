  const payloaders = (client, TOOL) => ({
  joinServerPayload: (serverAddress, server) => {
    const payload = {
      ...client,
      bypass: "",
      joinID: serverAddress,
      dbid: 2,
      roomPassword: "",
      peerID: TOOL.generatePeerId(),
    };
    delete payload.username;
    return { server, payload };
  },
  createServerPayload: (options, token) => {
  const payload = {
    ...client,
    country: options.country || "BR",
    dbid: client.guest ? 0 : 12970255,
    guest: client.guest || false,
    hidden: options.hidden || 0,
    latitude: 0,
    longitude: 0,
    maxLevel: options.maxLevel || 999,
    maxPlayers: (options.maxPlayers < 1 || options.maxPlayers > 8 ? 6 : options.maxPlayers),
    minLevel: options.minLevel || 0,
    mode: "custom",
    password: options.password || "",
    peerID: TOOL.generatePeerId(),
    quick: false,
    roomName: options.roomName || `${client.username ?? client.guestName}'s game`
  };

  return {
    ...payload,
    ...(!client.guest && token ? { token } : {})
  };
}

});

module.exports = payloaders;