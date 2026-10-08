import { registerHolidayTools } from "./holiday.js";
import { registerKlarnaTools } from "./klarna.js";
import { registerMobilityTools } from "./mobility.js";
import { registerRealestateTools } from "./realestate.js";
import { registerTorgetTools } from "./torget.js";

export function registerTools(target) {
  registerTorgetTools(target);
  registerMobilityTools(target);
  registerRealestateTools(target);
  registerHolidayTools(target);
  registerKlarnaTools(target);
}
