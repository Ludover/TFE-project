const http = require("http");
const debug = require("debug")("node-angular");
const socketIo = require("socket.io");
const app = require("./app");

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
const socketIoServer = socketIo(server, {
  cors: {
    origin: "http://www.monpopcorn.com",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

server.on("error", onError);
server.on("listening", onListening);
server.listen(port);

socketIoServer.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  socket.join(userId);

  socket.on("friendRequest", (request) => {
    // Émettre uniquement à l'utilisateur cible de la demande d'ami
    const targetUserId = request.targetUserId; // Exemple: l'ID de l'utilisateur à qui la demande est destinée
    socketIoServer.to(targetUserId).emit("friendRequest", request);
  });

  socket.on("movieRecommended", (movie) => {
    // Émettre uniquement à l'utilisateur cible de la recommandation de film
    const targetUserId = movie.targetUserId; // Exemple: l'ID de l'utilisateur à qui le film est recommandé
    socketIoServer.to(targetUserId).emit("movieRecommended", movie);
  });
});
