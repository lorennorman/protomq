# ProtoMQ

Dynamic MQTT Broker that speaks protobufs. Includes a web UI for inspecting
connections, decoding protobuf messages, and sending messages to connected devices.

## Get Started

1. Clone this repo
2. Run `npm i` (requires Node.js v18+)
3. Copy the environment example file: `cp .env.example.json .env.json`
4. Edit `.env.json` with the local path to your `.proto` files
5. Run `npm run import-protos` to copy and transform the proto definitions
6. Run `npm run build-web` to build the web frontend
7. Run `npm start`
8. Visit the web UI at `http://localhost:5173/`
9. Connect an MQTT client to `mqtt://localhost:1884`
10. Kill background task versions of protomq in windows: `Get-WmiObject Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'main\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`

## Ports

| Service    | Port |
|------------|------|
| MQTT       | 1884 |
| WebSocket  | 8888 |
| Web UI     | 5173 |

## Web UI Features

- **Clients**: Live view of connected MQTT clients
- **Subscriptions**: See what topics each client is subscribed to
- **Message Log**: All messages with protobuf decoding (newest first)
- **Protobufs**: Browse all loaded proto definitions, create and send messages via forms
- **Scripts**: Load, activate, and step through playback scripts

## Playback Scripts

Scripts are JSON files in the `scripts/` directory that define sequences of protobuf
messages to send in response to device activity. They're useful for testing device
firmware without a full backend.

### Usage

- Scripts are loaded automatically on startup but **no script is active by default**
- Optionally activate at startup with either form:
  - `npm run start -- --active-script="..."`
  - `npm run start --active-script="..."`
  - Accepts full JSON path, script filename, or exact JSON `name` field
  - Examples:
    - `npm run start -- --active-script="scripts/pi5-eyespi-beret-st7735r-demo.json"`
    - `npm run start -- --active-script="pi5-eyespi-beret-st7735r-demo"`
    - `npm run start -- --active-script="Pi 5 EYESPI Beret ST7735R Demo"`
- Activate a script via the Scripts panel in the web UI
- Once active, trigger steps fire automatically when matching messages arrive
- Sequenced steps fire after their predecessor completes (with optional delay)
- Steps can also be sent manually via the Send button in the UI

### Included Demo Scripts

- `scripts/feather-s2-sh1107-demo.json`: Adafruit Feather ESP32-S2 with SH1107 128x64 I2C OLED FeatherWing.
- `scripts/guition-p4-dsi-demo.json`: Guition ESP32-P4 with JC1060P470 1024x600 MIPI DSI display.
- `scripts/huzzah8266-oled128x32-demo.json`: Adafruit Feather Huzzah ESP8266 with SSD1306 128x32 I2C OLED FeatherWing.
- `scripts/magtag-demo.json`: Adafruit MagTag full hardware exercise (SSD1680 EPD + pixels/buttons/LED/sensor/buzzer).
- `scripts/metro-s2-charlcd-demo.json`: Adafruit Metro ESP32-S2 with MCP23008-based 16x2 I2C character LCD.
- `scripts/metro-s3-oled-demo.json`: Adafruit Metro ESP32-S3 with SSD1306 128x32 I2C OLED.
- `scripts/pi5-eyespi-beret-st7735r-demo.json`: Raspberry Pi 5 + Adafruit EYESPI Pi Beret with ST7735R 1.8" 128x160 SPI TFT.
- `scripts/qualia-bar-5797-demo.json`: Adafruit Qualia ESP32-S3 with PID 5797 320x820 RGB TTL bar display.
- `scripts/qualia-round-5792-demo.json`: Adafruit Qualia ESP32-S3 with PID 5792 480x480 RGB TTL round display.
- `scripts/reverse-tft-s3-demo.json`: Adafruit Feather ESP32-S3 Reverse TFT with ST7789 SPI TFT.

### Script Format

```json
{
  "name": "Human-readable name",
  "description": "What this script tests",
  "protoVersion": "v2",
  "steps": [
    {
      "name": "checkin-response",
      "description": "Respond to device checkin",
      "trigger": "checkin.request",
      "response": {
        "checkin": {
          "response": { "response": 1, "totalGpioPins": 20 }
        }
      }
    },
    {
      "name": "add-display",
      "description": "Configure display after checkin",
      "after": "checkin-response",
      "delay": 2000,
      "topic": "display",
      "send": {
        "display": {
          "add": { "driver": "ST7789", "name": "tft0" }
        }
      }
    }
  ]
}
```

### Step Types

**Trigger steps** execute when a matching field path exists in an incoming device message:
- `"trigger": "checkin.request"` — matches any D2B message containing `checkin.request`
- `"response": { ... }` — B2D payload sent back to the device

**Sequenced steps** execute after a named step completes:
- `"after": "step-name"` — wait for this step to complete first
- `"delay": 2000` — additional delay in milliseconds
- `"send": { ... }` — B2D payload to publish to the device

### Gotchas

- **Enum values**: Use numeric values (e.g., `"response": 1`) not string names
  (`"response": "R_OK"`). protobufjs encodes unknown string enum names as 0.
- **Topic routing**: V2 devices subscribe to a single B2D topic. The script runner
  derives the correct topic from the incoming D2B message automatically.
- **`checkin.complete` semantics**: For V2 scripts, `waitFor: "checkin.complete"`
  is emitted when the broker receives MQTT `PUBACK` for the script's
  `checkin.response` publish (transport completion), not when a follow-up D2B
  checkin payload arrives.

## Autoresponders

When no script is active (or a message doesn't match any script trigger), built-in
fallback handlers respond to common messages:

- **V2 checkin**: Automatically responds with `R_OK` and default board capabilities
- **V1 checkin**: Responds with `RESPONSE_OK` (V1 flat message format)

## Authentication

The broker accepts any credentials except specifically invalid test values
(`invalid_io_user`, `invalid_io_key`, client IDs containing `invalid`).

## Proto Import

ProtoMQ transforms `.proto` files into a JSON bundle that protobufjs can load at
runtime. Configure the source path in `.env.json`:

```json
{
  "protobufSource": "c:/path/to/your/proto/definitions"
}
```

Then run `npm run import-protos` to regenerate `protobufs/bundle.json`.
