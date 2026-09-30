import { loadConfig } from "./config.mjs";
import { createApp } from "./app.mjs";

const config = loadConfig();
createApp(config).listen(config.port, () => {
  console.log(`AWallet server on :${config.port} (origin ${config.allowedOrigin}, rpId ${config.rpId})`);
});
