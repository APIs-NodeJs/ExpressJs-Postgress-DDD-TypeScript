import "dotenv/config";
import { App } from "./app";

const application = new App();
const PORT = parseInt(process.env.PORT || "3000");

application.start(PORT);
