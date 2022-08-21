import { runShell } from "./libs/os.js";
import { loadLunarCommand } from "./startLunar.js";

const version = Deno.args[0];
const jreArgs = Deno.args[1];
const lunarArgs = Deno.args[2] ? Deno.args[2] : "--width 1280 --height 720";

const cmd = await loadLunarCommand(version, jreArgs, lunarArgs);

console.log("INFO: Starting Lunar...");
await runShell(cmd);