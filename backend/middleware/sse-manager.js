const clients = {}; // Contient les clients connectés avec SSE

function eventsHandler(req, res) {
  const userId = req.query.userId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*"); // Permettre les requêtes de toutes les origines
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.flushHeaders(); // Permet d'envoyer les en-têtes immédiatement

  // Envoyer un keep-alive toutes les 15 secondes
  const keepAliveInterval = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 15000);

  clients[userId] = res; // Associe la réponse à un userId

  req.on("close", () => {
    delete clients[userId]; // Retire le client à la déconnexion
    clearInterval(keepAliveInterval);
  });
}

function sendEvent(userId, eventType, data) {
  if (clients[userId]) {
    clients[userId].write(`data: ${JSON.stringify({ eventType, data })}\n\n`);
  }
}

module.exports = { eventsHandler, sendEvent };
