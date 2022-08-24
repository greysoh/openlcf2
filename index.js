import { runShell } from "./libs/os.js";
import { joinPath } from "./libs/join.js";
import { loadLunarCommand } from "./startLunar.js";

import { existsSync } from "https://deno.land/std@0.152.0/fs/mod.ts";
import { Confirm, Input } from "https://deno.land/x/cliffy@v0.24.3/mod.ts";
import dir from "https://deno.land/x/dir/mod.ts";

if (!existsSync(dir("home"), ".lunarclient", "settings", "launcher.json")) {
  console.error("ERROR: Lunar client config does not exist.");
  Deno.exit(1);
}

const lunarConfig = JSON.parse(
  await Deno.readTextFile(
    await joinPath(dir("home"), ".lunarclient", "settings", "launcher.json")
  )
);

// FIXME: Reading the file twice is a bit redundant.
if (!existsSync("config.json")) {
  await Deno.writeTextFile(
    "config.json",
    JSON.stringify(
      {
        serverIP: "None",
      },
      null,
      2
    )
  );
}

const localConfig = JSON.parse(await Deno.readTextFile("config.json"));

if (await Confirm.prompt("Would you like to modify your selected options?")) {
  let version, server;
  const lunarPathDefault = localConfig.customLunarPath
    ? localConfig.customLunarPath
    : await joinPath(dir("home"), ".lunarclient"); // Jank is my middle name
  let lunarPath = lunarPathDefault;

  version = await Input.prompt({
    message: "Select your version",
    default: lunarConfig.selectedSubversion,
  });

  server = await Input.prompt({
    message: "Input a server IP to join",
    default: localConfig.serverIP,
  });

  lunarPath = await Input.prompt({
    message: "Where is Lunar Client located?",
    default: lunarPath,
  });

  if (server != localConfig.serverIP) {
    let config = localConfig; // Is let needed?
    config.serverIP = server;

    await Deno.writeTextFile("config.json", JSON.stringify(config, null, 2));
  }

  if (lunarPath != lunarPathDefault) {
    let config = localConfig;
    config.customLunarPath = lunarPath;

    await Deno.writeTextFile("config.json", JSON.stringify(config, null, 2));
  }

  const lunarCmd = await loadLunarCommand(
    version,
    lunarConfig.launchDirectory,
    lunarPath,
    "",
    `--width ${lunarConfig.resolution.width} --height ${
      lunarConfig.resolution.height
    } ${server != "None" ? `--server "${server}"` : ""}`
  );
  await runShell(lunarCmd);
} else {
  console.log("Starting Lunar...");

  const lunarCmd = await loadLunarCommand(
    lunarConfig.selectedSubversion,
    lunarConfig.launchDirectory,
    localConfig.customLunarPath
      ? localConfig.customLunarPath
      : await joinPath(dir("home"), ".lunarclient"),
    "",
    `--width ${lunarConfig.resolution.width} --height ${
      lunarConfig.resolution.height
    } ${
      localConfig.serverIP != "None" ? `--server "${localConfig.serverIP}"` : ""
    }`
  );
  await runShell(lunarCmd);
}
