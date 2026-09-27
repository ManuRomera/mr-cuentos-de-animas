import { readFile, readdir, stat, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const errors = [];
async function walk(dir) {
  const out=[];
  for (const name of await readdir(dir)) {
    if (["dist","node_modules",".git"].includes(name)) continue;
    const p=join(dir,name); const s=await stat(p);
    if (s.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const files=await walk(root);
for (const file of files.filter(f=>f.endsWith('.mjs'))) {
  const r=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  if(r.status!==0) errors.push(`${relative(root,file)}\n${r.stderr}`);
}
for (const file of files.filter(f=>f.endsWith('.json'))) {
  try { JSON.parse(await readFile(file,'utf8')); } catch(e) { errors.push(`${relative(root,file)}: ${e.message}`); }
}
const manifest=JSON.parse(await readFile(join(root,"system.json"),"utf8"));
if(manifest.id!=="mr-cuentos-de-animas") errors.push("system.json: id inesperado");
if(Number(manifest.compatibility?.minimum)<13) errors.push("system.json: minimum debe ser 13+");
const refs=[...new Set(files.filter(f=>/\.(mjs|hbs|css|json|md|html)$/.test(f)).flatMap(async()=>[]))];
const required=[
 "assets/branding/cover.webp","assets/branding/logo.svg","assets/branding/table.webp",
 "assets/cards/back.webp","assets/cards/number-back.webp","assets/cards/gray-1.webp","assets/cards/gray-2.webp","assets/cards/gray-3.webp",
 "assets/counters/spirit-on.webp","assets/counters/spirit-off.webp","assets/counters/determination-on.webp","assets/counters/determination-off.webp"
];
for(let i=1;i<=10;i++) required.push(`assets/cards/number-${i}.webp`);
for(const p of required) try{await access(join(root,p));}catch{errors.push(`Falta asset: ${p}`)}
if(errors.length){ console.error(errors.join("\n\n")); process.exit(1); }
console.log(`✓ ${files.filter(f=>f.endsWith('.mjs')).length} módulos JS válidos`);
console.log(`✓ ${files.filter(f=>f.endsWith('.json')).length} JSON válidos`);
console.log(`✓ ${required.length} assets críticos presentes`);
console.log("✓ Validación estática completada");
