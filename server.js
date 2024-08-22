const http = require("http");
const debug = require("debug")("node-angular");
const socketIo = require("socket.io");
const app = require("./backend/app");

const normalizePort = (val) => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

const onError = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "pipe" + port : "port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      Console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);
const io = socketIo(server);

const users = {}; // Un objet pour stocker les sockets des utilisateurs

io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');

  // Lorsqu'un utilisateur se connecte, on peut stocker son socket.id avec son userId
  socket.on('register', (userId) => {
    users[userId] = socket.id; // Associe l'userId au socket.id
  });

  // Lorsqu'une demande d'ami est reçue
  socket.on('friendRequestReceived', (data) => {
    const targetUserId = data.to; // L'utilisateur qui doit recevoir la demande d'ami

    // Si l'utilisateur est connecté, on lui envoie un message spécifique
    if (users[targetUserId]) {
      io.to(users[targetUserId]).emit('updateFriendRequests', data.friendRequest);
    }
  });

  // Lorsqu'un film est conseillé
  socket.on('movieReceived', (data) => {
    const targetUserId = data.to; // L'utilisateur qui doit recevoir le film conseillé

    if (users[targetUserId]) {
      io.to(users[targetUserId]).emit('updateMoviesList', data.friendRequest);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
    // Supprimer l'utilisateur de l'objet users lorsqu'il se déconnecte
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
  });
});


server.on("error", onError);
server.on("listening", onListening);
server.listen(port);
