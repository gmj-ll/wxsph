const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const path = require("path");
const { init: initDB, Counter } = require("./db");
const wol = require('wake_on_lan');
const dgram = require('dgram');

const router = new Router();

const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

const targetMacAddress = '50:EB:F6:9C:70:D4';

// 首页
router.get("/", async (ctx) => {
  ctx.body = homePage;
});

// 更新计数
router.post("/api/count", async (ctx) => {
  const { request } = ctx;
  const { action } = request.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }

  ctx.body = {
    code: 0,
    data: await Counter.count(),
  };
});

// 获取计数
router.get("/api/count", async (ctx) => {
  const result = await Counter.count();

  ctx.body = {
    code: 0,
    data: result,
  };
});

// 小程序调用，获取微信 Open ID
router.get("/api/wx_openid", async (ctx) => {
  if (ctx.request.headers["x-wx-source"]) {
    ctx.body = ctx.request.headers["x-wx-openid"];
  }
});

// 获取公众号消息

router.all("/getMsg", async (ctx) => {
  const appid = ctx.request.headers['x-wx-from-appid'] || ''
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = ctx.request.body
  console.log(ToUserName)
  console.log(FromUserName)
  console.log(MsgType)
  console.log(Content)
  console.log(CreateTime)
  // 生成魔术包
//   const magicPacket = wol.createMagicPacket(targetMacAddress);

//   // 创建 IPv6 UDP 套接字
//   const client = dgram.createSocket('udp6');

//   const targetIpv6Address = '2409:8a28:a53:ce20::1'; // 替换为目标设备的 IPv6 地址
//   const targetPort = 9; // WOL 默认使用端口 9
//   client.send(magicPacket, 0, magicPacket.length, targetPort, targetIpv6Address, (error) => {
//     client.close(); // 关闭套接字
//     if (error) {
//         ctx.status = 500;
//         ctx.body = { error: 'Failed to send Magic Packet' };
//     } else {
//         ctx.status = 200;
//         ctx.body = { message: 'Magic Packet sent successfully' };
//     }
// });

  ctx.body = {
    ToUserName,
    FromUserName,
    CreateTime,
    MsgType,
    Content: "这是回复的消息" // 自定义回复内容
  };
});

const app = new Koa();
app
  .use(logger())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 80;
async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}
bootstrap();
