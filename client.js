const socket = io("http://localhost:8080");

const containerJogo = document.getElementById("game");
const containerPontuacoes = document.getElementById("scores");

// Prompt para obter o nome do jogador ou definir como "Jogador" se não for fornecido
 let nomeJogador = prompt("Digite seu nome:") || "Jogador";
 socket.emit("registrarJogador", nomeJogador);


// Eventos do servidor Socket.io
socket.on("inicioJogo", lidarInicioJogo);
socket.on("atualizacaoTesouro", lidarAtualizarTesouro);
socket.on("fimDeJogo", lidarFimDeJogo);
socket.on("jogadorEntrou", lidarJogadorEntrou);
socket.on("jogadorSaiu", lidarJogadorSaiu);

function lidarInicioJogo(data) {
  const { tesouros, pontuacoes, jogadores, coordenadasTesouro } = data;

  // Cria os elementos dos tesouros no documento com base nos dados recebidos do server
  tesouros.forEach((tesouro, indice) => {
    const { encontrado } = tesouro;
    const coordenadas = coordenadasTesouro[indice];
    criarTesouro(indice, encontrado, coordenadas);
  });

  // Recebe os dados do server e cria os elementos das pontuações no documento 
  for (const idJogador in jogadores) {
    const nome = jogadores[idJogador];
    criarElementoPontuacao(idJogador, nome);
  }

  // Recebe os dados do server e atualiza as pontuações no documento
  atualizarPontuacoes(pontuacoes, jogadores);
}

// É chamada quando um tesouro é encontrado
function lidarAtualizarTesouro(data) {
  const { indice, idJogador, pontuacoes, jogadores } = data;

  // Marca o tesouro como encontrado no documento
  const elementoTesouro = document.getElementById(`tesouro-${indice}`);
  elementoTesouro.classList.add("encontrado");

  containerJogo.classList.add("game-piscar");
  setTimeout(() => {
    containerJogo.classList.remove("game-piscar");
  }, 1000);

  atualizarPontuacoes(pontuacoes, jogadores);

  // Verifica se o jogador alcançou a pontuação necessária para vencer
  if (pontuacoes[idJogador] >= 3) {
    encontrarVencedor(idJogador);
  }
}

function lidarFimDeJogo(data) {
  const idJogadorAtual = socket.id;
  const { idVencedor } = data;

  
  if (idJogadorAtual === idVencedor) {
    alert("Você venceu encontrando mais tesouros!");
  } else {
    alert("Que pena! Você fez menos pontos do que seu amigo!");
  }

  // Encerra a conexão com o servidor
  socket.close();
}

function lidarJogadorEntrou(data) {
  const { idJogador, nome } = data;
  criarElementoPontuacao(idJogador, nome);
}

function lidarJogadorSaiu(data) {
  const { idJogador } = data;
  removerElementoPontuacao(idJogador);
}

function criarTesouro(indice, encontrado, coordenadas) {
  const tesouro = document.createElement("div");
  tesouro.id = `tesouro-${indice}`;
  tesouro.className = "tesouro";

  // Configura a aparência do tesouro com base em se foi encontrado ou não
  if (encontrado) {
    tesouro.classList.add("encontrado");
    tesouro.style.backgroundColor = "gray";
  }

  // Recebe as coordenadas do servidor e define a posição dos tesouros
  // Isso faz com que todos os clientes recebam os tesouros nas mesmas coordenadas
  tesouro.style.left = `${coordenadas.x}%`;
  tesouro.style.top = `${coordenadas.y}%`;

  
  tesouro.addEventListener("click", () => {
    socket.emit("tesouroEncontrado", indice);
  });

  // Adiciona o tesouro ao contêiner do jogo no documento
  containerJogo.appendChild(tesouro);
}


function criarElementoPontuacao(idJogador, nome) {
  const elementoPontuacao = document.createElement("div");

  // O ID do elemento é definido como "pontuacao-{idJogador}" para identificação única.
  elementoPontuacao.id = `pontuacao-${idJogador}`;
  elementoPontuacao.className = "pontuacao-jogador";
  elementoPontuacao.textContent = `${nome}: 0 ponto(s)`;

  containerPontuacoes.appendChild(elementoPontuacao);
}

function removerElementoPontuacao(idJogador) {
  const elementoPontuacao = document.getElementById(`pontuacao-${idJogador}`);
  if (elementoPontuacao) {
    elementoPontuacao.remove();
  }
}

// Recebe os dados do servidor para mostrar pro cliente a atualização do pontos
function atualizarPontuacoes(pontuacoes, jogadores) {
  // Ordena os jogadores com base na pontuação em ordem decrescente
  const jogadoresOrdenados = Object.keys(pontuacoes).sort((a, b) => pontuacoes[b] - pontuacoes[a]);

  // Remove os elementos existentes
  while (containerPontuacoes.firstChild) {
    containerPontuacoes.firstChild.remove();
  }

  // Cria os novos elementos das pontuações
  jogadoresOrdenados.forEach((idJogador, index) => {
    const pontuacao = pontuacoes[idJogador];
    const nome = jogadores[idJogador];
  
    const elementoPontuacao = document.createElement("div");
    elementoPontuacao.id = `pontuacao-${idJogador}`;
    elementoPontuacao.className = "pontuacao-jogador";
    elementoPontuacao.textContent = `${nome}: ${pontuacao} ponto(s)`;
  
    const medalhaEmoji = document.createElement("span");
    if (index === 0) {
      medalhaEmoji.textContent = "🥇";
      const coroaEmoji = document.createElement("span");
      coroaEmoji.textContent = "👑";
      elementoPontuacao.append(coroaEmoji);
    } else {
      medalhaEmoji.textContent = "🥈";
    }
    elementoPontuacao.prepend(medalhaEmoji);
  
    containerPontuacoes.appendChild(elementoPontuacao);
  });
  
}

// Notifica o servidor quando um jogador alcança a pontuação necessária para vencer
function encontrarVencedor(idVencedor) {
  socket.emit("fimDeJogo", idVencedor);
}



