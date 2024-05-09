# protomq
 Dynamic MQTT Broker that speaks protobufs

## Get Started

1. Clone this repo
2. run `npm i` (make sure NodeJS installed, i used v18 in dev)
3. copy the environment example file: `cp .env.example.json .env.json`
4. edit `.env.json` with the local path to your `.proto` files
5. run `npm run import-protos` to copy over and transform the files
6. run `npm run build-web` to build protomq
7. run `npm start`
8. visit the web URL it gives you (like `http://localhost:5173/`)
9. connect an MQTT client: `mqtt://localhost:1884`
10. see broker info update in the web:
  - clients change on connect/disconnect
  - subscriptions change on subscribe/unsubscribe
  - message log updates as new messages are published (top message is newest)
