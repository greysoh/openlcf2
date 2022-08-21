import { runShell } from "./libs/os.js";
import { loadLunarCommand } from "./startLunar.js";
import { existsSync } from "https://deno.land/std@0.152.0/fs/mod.ts";

const config = existsSync("./config.json") ? JSON.parse(await Deno.readTextFile("./config.json")) : {};
const version = config.version ? config.version : Deno.args[0] ? Deno.args[0] : new Error("No version specified");

if (version instanceof Error) throw version;

const jreArgs = config.jreArgs ? config.jreArgs : null;
const lunarArgs = config.lunarArgs ? config.lunarArgs : `--width ${config.width ? config.width : 1280} --height ${config.height ? config.height : 720}`;
const rootDir = config.rootDir ? config.rootDir : null;

const cmd = await loadLunarCommand(version, jreArgs, lunarArgs, rootDir);

console.log("INFO: Starting Lunar...");
await runShell(cmd);