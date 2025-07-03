# Bonk.io WebSocket Bot

Este projeto é um bot para interagir com salas do Bonk.io via WebSocket, utilizando `socket.io-client` compatível com EIO v3 (engine.io 3.x).

## 🛠 Tecnologias utilizadas

- Node.js
- socket.io-client (`^2.4.0`)
- EventEmitter
- Estrutura modular (classes reutilizáveis)

## 📁 Estrutura

```
.
├── index.js               # Arquivo principal
├── module/
│   ├── Client.js          # Classe principal do bot (BonkClient)
│   └── services/
│       └── WSbonk.js  # Gerenciador da conexão WebSocket
│       └── Commands.js  # Gerenciador da comandos
│       └── tools.js  # Ferramentas como api e etc..
├── package.json
└── README.md
```

## ⚠️ Erros comuns

....

## ✅ Requisitos

- Node.js >= 14
- Compatibilidade com EIO 3 (`socket.io-client@2.4.0`)

---

### 📜 Licença

Este projeto é apenas para fins educacionais. Todos os direitos pertencem aos seus respectivos autores.
