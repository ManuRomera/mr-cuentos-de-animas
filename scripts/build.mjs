import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const root=new URL("../",import.meta.url).pathname;
const dist=join(root,"dist"); const out=join(dist,"mr-cuentos-de-animas");
await rm(dist,{recursive:true,force:true}); await mkdir(out,{recursive:true});
const keep=["mr-cuentos-de-animas.mjs","system.json","LICENSE","NOTICE.md","README.md","CHANGELOG.md","module","styles","templates","lang","assets"];
for(const p of keep) await cp(join(root,p),join(out,p),{recursive:true});
// Release manifest travels next to the zip so Foundry can install it directly.
await cp(join(root,"system.json"),join(dist,"system.json"));
const zip=join(dist,"mr-cuentos-de-animas.zip");
const r=spawnSync("zip",["-qr",zip,"mr-cuentos-de-animas"],{cwd:dist,stdio:"inherit"});
if(r.status!==0) throw new Error("No se pudo crear el ZIP");
console.log(`✓ Build: ${zip}`);
