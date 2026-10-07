const { startTunnel } = require("untun");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌐 กำลังเชื่อมต่อ Cloudflare Tunnel ไปยังพอร์ต 3000...");
  const tunnel = await startTunnel({ port: 3000 });
  const url = await tunnel.getURL();

  console.log("\n==================================================");
  console.log("🚀 CLOUDFLARE TUNNEL พร้อมใช้งานแล้ว!");
  console.log("🌐 Public URL: " + url);
  console.log("🔗 Webhook URL สำหรับ LINE Developers Console:");
  console.log("👉 " + url + "/api/line/webhook");
  console.log("==================================================\n");

  // อัปเดต NEXT_PUBLIC_APP_URL ใน .env
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("NEXT_PUBLIC_APP_URL=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_APP_URL=.*/,
        `NEXT_PUBLIC_APP_URL="${url}"`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_APP_URL="${url}"`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log("✅ อัปเดต NEXT_PUBLIC_APP_URL ใน .env เรียบร้อย");
  }
}

main().catch((err) => {
  console.error("Tunnel error:", err);
});
