import dir from "https://deno.land/x/dir/mod.ts";
import { joinPath } from "./libs/join.js";

async function findJRE() {
  const lunarDir = await joinPath(dir("home"), ".lunarclient", "jre");

  for await (const dirEntry of Deno.readDir(lunarDir)) {
    if (!dirEntry.isDirectory) continue;
    if (dirEntry.isSymlink) {
      console.warn("WARN: JRE is a symlink. Continuing...");
      continue;
    }

    const dir = await joinPath(lunarDir, dirEntry.name);

    for await (const zulu of Deno.readDir(dir)) {
      if (!zulu.isDirectory) continue;
      if (zulu.isSymlink) {
        console.warn("WARN: JRE is a symlink. Continuing...");
        continue;
      }

      const zuluDir = await joinPath(dir, zulu.name);

      return await joinPath(
        zuluDir,
        "bin",
        Deno.build.os === "windows" ? "java.exe" : "java"
      );
    }
  }
}

async function findCopyFiles(version, isIchor) {
  const data = [];

  const multiverRoot = await joinPath(
    dir("home"),
    ".lunarclient",
    "offline",
    "multiver"
  );

  for await (const multiverData of Deno.readDir(multiverRoot)) {
    if (multiverData.isDirectory) continue;
    if (multiverData.isSymlink) {
      console.warn(
        "WARN: Multiver data '%s' is a symlink. Continuing...",
        multiverData.name
      );
      continue;
    }

    if (
      (multiverData.name.startsWith("lunar") ||
        multiverData.name.startsWith("lunar-") ||
        multiverData.name.startsWith("common-") || multiverData.name.startsWith("genesis")) &&
      multiverData.name.endsWith(".jar")
    ) {
      data.push(await joinPath(multiverRoot, multiverData.name));
    } else if (multiverData.name.toLowerCase().startsWith("optifine") && multiverData.name.endsWith(".jar")) {
      const verData = multiverData.name.startsWith("OptiFine") ? multiverData.name.split("v")[1].split(".")[0].replaceAll("_", ".") : version;

      if (version.startsWith(verData)) {
        data.push(await joinPath(multiverRoot, multiverData.name));
      }
    } else if (multiverData.name.startsWith("v") && multiverData.name.endsWith(".jar")) {
      const verData = multiverData.name.split("v")[1].split("-")[0].replaceAll("_", ".");

      if (version.startsWith(verData)) {
        data.push(await joinPath(multiverRoot, multiverData.name));
      }
    }
  }

  return data.join(isIchor ? "," : ";");
}

export async function loadLunarCommand(version, jreArgs, lunarArgs) {
  let cmd = "";
  const jre = await findJRE();

  console.log("INFO: JRE found at '%s'", jre);

  const nativesDir = await joinPath(
    dir("home"),
    ".lunarclient",
    "offline",
    "multiver",
    "natives"
  );

  cmd += `${jre} --add-modules jdk.naming.dns --add-exports jdk.naming.dns/com.sun.jndi.dns=java.naming`;
  cmd += ` -Djna.boot.library.path=${nativesDir}`;
  cmd += ` -Dlog4j2.formatMsgNoLookups=true`; // Disable lookups for log4j so that computer no go boom
  cmd += ` --add-opens java.base/java.io=ALL-UNNAMED${
    jreArgs ? " " + jreArgs : ""
  }`;
  cmd += ` -Djava.library.path=${nativesDir}`;
  cmd += ` -XX:+DisableAttachMechanism -cp`;

  cmd += ` ${await findCopyFiles(version)} com.moonsworth.lunar.genesis.Genesis`;
  cmd += ` --version ${version}`;
  cmd += ` --accessToken 0 --assetIndex ${version} --userProperties {} --gameDir`;
  cmd += ` ${Deno.build.os == "windows" ? await joinPath(dir("home"), "AppData", "Roaming", ".minecraft") : await joinPath(dir("home"), ".minecraft")}`;
  cmd += ` --texturesDir ${await joinPath(dir("home"), ".lunarclient", "textures")}`;
  cmd += ` --ichorClassPath ${await findCopyFiles(version, true)}`;
  cmd += ` --ichorExternalFiles OptiFine-${version.split(".")[0]}.${version.split(".")[1]}.jar`
  cmd += ` --workingDirectory . --classpathDir ${nativesDir}`;
  cmd += lunarArgs ? " " + lunarArgs : "";
  
  return cmd;
}
