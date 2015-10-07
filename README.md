Tic-Tac-Toe Node Game Server
============================

It is a game server allowing two player's connections at the same time. The server uses **websocket** to notify the player what to do next. The data format of the protocol packet is in **JSON string**.

The game server is designated for either human beings or robot to fight each other.

Usage
-----

Enter the following command and the server will get launched.

```
> npm install
> npm start
```

There's a simple client for testing. Enter the command to make it online. Of course you can only launch two clients connecting to the server at the same time.

```
> npm run client
```

The Protocol
------------

