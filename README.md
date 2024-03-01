# protomq
 Dynamic MQTT Broker that speaks protobufs

## Get Started

1. Clone this repo
2. run `npm i` (make sure NodeJS installed, i used v18 in dev)
3. copy the environment example file: `cp .env.example.json .env.json`
4. edit `.env.json` with the local path to your `.proto` files
5. run `npm import-protos` to copy over and transform the files
6. run `npm start`
7. visit the web URL it gives you (like `http://localhost:5173/`)
8. connect an MQTT client: `mqtt://localhost:1884`
9. see broker info update in the web:
  - clients change on connect/disconnect
  - subscriptions change on subscribe/unsubscribe
  - message log updates as new messages are published (top message is newest)
