# protomq
 Dynamic MQTT Broker that speaks protobufs

## Get Started

1. Clone this repo
2. run `npm i`
3. run `npm start`
4. visit the web URL it gives you (like `http://localhost:5173/`)
5. connect an MQTT client: `mqtt://localhost:1884`
6. see broker info update in the web:
  - clients change on connect/disconnect
  - subscriptions change on subscribe/unsubscribe
  - message log updates as new messages are published (top message is newest)
