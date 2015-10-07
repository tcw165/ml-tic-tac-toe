import {server as WebSocketServer} from 'websocket';
import http from 'http';
import util from 'util';
import repl from 'repl';

import colors from 'colors/safe';

import Game from './game/main.js';

const MAX_CONCURRENT_CONNECTION = 2;

var game = new Game();

// Default is false. Set to the connection if the server is waiting for the
// response.
var isWaitingFor = false;
var server = http.createServer(function(request, response) {
  console.log('\n%s Received request for %s', new Date(), request.url);
  response.writeHead(404);
  response.end();
});

// Set theme of output.
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

server.listen(8080, function() {
  // First time to start the game.
  game.start();

  // Prompt again just for beautiful UI.
  replServer.prompt();
});

var wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

var currentPlayer = function() {
  return wsServer.connections[game.playerRound()];
};

var msgCurrentPlayer = function(jsonMsg, connection) {
  if (connection) {
    connection.sendUTF(JSON.stringify(jsonMsg));
  } else {
    currentPlayer().sendUTF(JSON.stringify(jsonMsg));
  }
};

var msgAllPlayersGameOver = function() {
  if (game.winner === 0) {
    wsServer.connections.forEach(function(conn, i) {
      conn.sendUTF(JSON.stringify({
        res: 'draw',
        board: game.state
      }));
    });
  } else {
    wsServer.connections.forEach(function(conn, i) {
      if (i + 1 === game.winner) {
        conn.sendUTF(JSON.stringify({
          res: 'win',
          board: game.state
        }));
      } else {
        conn.sendUTF(JSON.stringify({
          res: 'lose',
          board: game.state
        }));
      }
    });
  }

  updateWaitingFor(true);
};

var updateWaitingFor = function(isFree) {
  if (isFree) {
    isWaitingFor = false;
  } else {
    isWaitingFor = wsServer.connections[game.playerRound()];
  }
};

var askCurrentPlayerPlay = function() {
  updateWaitingFor();
  msgCurrentPlayer({
    req: 'your_turn',
    board: game.state
  });
};

////////////////////////////////////////////////////////////////////////////////
// Websocket ///////////////////////////////////////////////////////////////////

wsServer.on('request', function(request) {
  // Limit the concurrent connection.
  if (wsServer.connections >= MAX_CONCURRENT_CONNECTION) {
    request.reject();
    return;
  }

  var connection = request.accept('echo-protocol', request.origin);
  console.log('\n%s Connection accepted (%s/%s).',
              new Date(),
              wsServer.connections.length,
              MAX_CONCURRENT_CONNECTION);

  // Prompt again just for beautiful UI.
  replServer.prompt();

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      try {
        var msg = JSON.parse(message.utf8Data);

        // Request cases.
        switch (msg.req) {
        case 'board':
          msgCurrentPlayer({
            res: 'board',
            board: game.state
          });
          break;
        case 'place':
          // Do nothing if it is not the round for the incoming connection.
          if (isWaitingFor && connection === isWaitingFor) {
            if (!game.place(msg.x, msg.y)) {
              // Notify the player the new state of board.
              msgCurrentPlayer({
                res: 'place',
                board: game.state
              }, connection);
              // Notify another player to play.
              askCurrentPlayerPlay();
            } else {
              // Notify all the players the result if the game is over.
              msgAllPlayersGameOver(game.winner);
              game.restart();
              askCurrentPlayerPlay();
            }
          }
          break;
        }
      } catch (e) {
        // DO NOTHING.
      }
      // connection.sendUTF(message.utf8Data);
    }
  });

  connection.on('close', function(reasonCode, description) {
    console.log('\n%s Peer %s disconnected.', new Date(), connection.remoteAddress);
    replServer.prompt();
  });

  // Start the game automatically when the players are all in the room.
  if (wsServer.connections.length == MAX_CONCURRENT_CONNECTION) {
    askCurrentPlayerPlay();
  }
});

////////////////////////////////////////////////////////////////////////////////
// REPL Game Tester ////////////////////////////////////////////////////////////

// REPL.
var replServer = repl.start({
  prompt: colors.prompt('game command > '),
  ignoreUndefined: true
});

// REPL simulated command.
replServer.context.board = function() {
  game.print();
  replServer.prompt();
};
replServer.context.place = function(x, y) {
  // Lose control if there's incoming connection.
  if (wsServer.connections.length > 0) return;

  var winner = game.place(x, y);

  // If there's a winner.
  if (winner) {
    if (winner === 3) {
      console.log(colors.verbose('Game over!!! Draw~ no winner!'));
    } else {
      console.log(colors.verbose('Game over!!! Winner is player %s.'),
                  game.printWinner(winner));
    }

    // Restart the game.
    game.restart();
  }
};
replServer.context.start = replServer.context.restart = function() {
  // Lose control if there's incoming connection.
  if (wsServer.connections.length > 0) return;

  game.start();
};
replServer.context.p = replServer.context.print = function() {
  game.print();
}
replServer.context.h = replServer.context.help = function() {
  console.log(colors.info([
    'board        to show the grid.',
    'place(x, y)  to mark the grid.',
    'start()      to start a new game.',
    'restart()    to start a new game.'
  ].join(require('os').EOL)));
};
// Debug.
replServer.context.server = server;
replServer.context.wsServer = wsServer;
