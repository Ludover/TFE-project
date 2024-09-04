const clients = {}; // Contient les clients connectés avec SSE

function eventsHandler(req, res) {
  const userId = req.query.userId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Permet d'envoyer les en-têtes immédiatement

  clients[userId] = res; // Associe la réponse à un userId

  req.on("close", () => {
    delete clients[userId]; // Retire le client à la déconnexion
  });
}

function sendEvent(userId, eventType, data) {
  if (clients[userId]) {
    clients[userId].write(`data: ${JSON.stringify({ eventType, data })}\n\n`);
  }
}

module.exports = { eventsHandler, sendEvent };
