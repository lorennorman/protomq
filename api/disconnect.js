

export default (router, broker) => {
  console.log("Installing Disconnect Command")

  // Disconnect a connected client by id
  router.post('/disconnect', ({ protomq: { client, clientId }}, res) => {
    if(!client) {
      res.json({ status: 'ERROR', message: `No client found with id: ${clientId}` })
      return
    }

    client.close(() => res.json({ status: 'OK' }))
    console.log(`Client "${client.id} disconnected by api`)
  })
}
