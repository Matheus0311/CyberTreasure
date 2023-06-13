const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Configuração do middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Configurar uma rota para a página de erro
app.use((req, res) => {
  res.status(404).sendFile(__dirname + '/404.html');
});



const maximoTesouros = 5;
const maximoJogadores = 2;
const jogadores = {};
let tesourosEncontrados = [];
let pontuacoesJogadores = {};
let coordenadasTesouro = [];
let numeroJogadores = 0;

io.on("connection", (socket) => {
  if (numeroJogadores >= maximoJogadores) {
    socket.disconnect();
    return;
  }
  numeroJogadores++;

  socket.on("registrarJogador", (nome) => {
    // Registra o jogador com seu nome e inicializa sua pontuação como 0
    jogadores[socket.id] = nome;
    pontuacoesJogadores[socket.id] = 0;

    // Envia os dados iniciais do jogo para o jogador recém-registrado
    socket.emit("inicioJogo", {
      tesouros: tesourosEncontrados,
      pontuacoes: pontuacoesJogadores,
      jogadores,
      coordenadasTesouro,
    });
    

    // Notifica os outros jogadores que um novo jogador entrou no jogo
    socket.broadcast.emit("jogadorEntrou", { idJogador: socket.id, nome });
  });


  socket.on("tesouroEncontrado", (indice) => {
    if (!tesourosEncontrados[indice].encontrado) {
      // Marca o tesouro como encontrado, incrementa a pontuação do jogador e notifica os jogadores
      tesourosEncontrados[indice].encontrado = true;
      pontuacoesJogadores[socket.id]++;
      io.emit("atualizacaoTesouro", {
        indice,
        idJogador: socket.id,
        pontuacoes: pontuacoesJogadores,
        jogadores,
      });

      // Verifica se algum jogador alcançou a pontuação necessária para vencer o jogo
      // É importante deixar essa função aqui pois verifica sempre que um tesouro é encontrado
      // Então não é preciso que os 5 tesouros sejam encontrados, apenas que um usuário ache 3
      encontrarVencedor();
    }
  });

  socket.on("disconnect", () => {
    const nomeJogador = jogadores[socket.id];
    // Remove o jogador da lista de jogadores e notifica os outros jogadores
    delete jogadores[socket.id];
    delete pontuacoesJogadores[socket.id];
    socket.broadcast.emit("jogadorSaiu", { idJogador: socket.id, nome: nomeJogador });
    numeroJogadores--;
  });
});

// Gera os tesouros iniciais do jogo
gerarTesouros();


function encontrarVencedor() {
  for (const idJogador in pontuacoesJogadores) {
    if (pontuacoesJogadores[idJogador] >= 3) {
      // Notifica os jogadores sobre o fim do jogo e o jogador vencedor
      io.emit("fimDeJogo", { idVencedor: idJogador });
      return;
    }
  }
}

// Função para gerar os tesouros iniciais do jogo
// Tem que ser do lado do servidor pra todos receberem as mesmas posições
function gerarTesouros() {
  for (let i = 0; i < maximoTesouros; i++) {
    const encontrado = false;
    const coordenadas = {
      x: getRandomInt(10, 90),
      y: getRandomInt(10, 90),
    };

    tesourosEncontrados.push({ encontrado }); // Adiciona tesouro ao array tesourosEncontrados
    coordenadasTesouro.push(coordenadas);
  }
  
}

// Função auxiliar para gerar um número inteiro aleatório
// entre um valor mínimo e máximo (inclusive)
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Inicia o servidor na porta 8080
server.listen(8080, () => {
  console.log("Servidor iniciado na porta 8080");
});
