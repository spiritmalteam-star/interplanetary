import { fuelStatus } from "../src/lib/server/fuel-engine";
try {
  const s = await fuelStatus("gentikoltraka28@gmail.com");
  console.log("OK keys:", Object.keys(s).join(","));
  console.log("reserves:", JSON.stringify(s.reserves)?.slice(0, 200));
  console.log("recentGrants:", s.recentGrants?.length, "totals:", JSON.stringify(s.totals)?.slice(0, 200));
} catch (e) {
  console.error("FUEL STATUS THROWS:", e?.message);
  console.error(e?.stack?.split("\n").slice(0, 4).join("\n"));
}
process.exit(0);
