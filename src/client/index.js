import {client as WebSocketClient} from 'websocket';
import repl from 'repl';

import colors from 'colors/safe';

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

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
  console.log('Connect Error: ' + error.toString());
  replServer.close();
});

client.on('connect', function(connection) {
  console.log('WebSocket Client Connected');

  connection.on('error', function(error) {
    console.log("Connection Error: " + error.toString());
  });

  connection.on('close', function() {
    console.log('\necho-protocol Connection Closed');
    replServer.close();
  });

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log(colors.verbose('\nReceived: %s'), message.utf8Data);
      replServer.prompt();
    }
  });

  var msgServer = function(jsonMsg) {
    var jsonStr = JSON.stringify(jsonMsg);
    connection.sendUTF(jsonStr);
    console.log(colors.verbose('Send: %s'), jsonStr);
    replServer.prompt();
  };

  //////////////////////////////////////////////////////////////////////////////
  // REPL Game Tester //////////////////////////////////////////////////////////

  // REPL.
  var replServer = repl.start({
    prompt: colors.prompt('player command > '),
    ignoreUndefined: true
  });

  // REPL simulated command.
  replServer.context.place = function(x, y) {
    msgServer({
      req: 'place',
      x: x,
      y: y
    });
  };
  replServer.context.board = function() {
    msgServer({
      req: 'board'
    });
  };
  replServer.context.h = replServer.context.help = function() {
    console.log(colors.info([
      'place(x, y)  to mark the grid.',
      'board()      to see the state of the game.'
    ].join(require('os').EOL)));
  };
  replServer.context.repl = replServer;
});

client.connect('ws://localhost:8080/', 'echo-protocol');
