const config = {
  password: "", // 管理面板使用密码
  cors: true, // 是否允许CORS使用API
  load_r2: true, // 允许 load R2 to localStorage 按钮
}

// ====== R2 S3 API 配置 (文件保管站 file-r2 模式) ======
// 以下变量推荐通过 Cloudflare 面板的环境变量(Variables)/加密机密(Secrets)注入, 作为全局变量自动可用
// 注意: 面板中的变量名必须与代码完全一致(注意大小写敏感)
// 偷懒也可以直接在这里赋值
//   R2_S3_ENDPOINT       = "" // - S3 API 完整 URL, 如 https://xxx.r2.cloudflarestorage.com (优先于 R2_ACCOUNT_ID 拼装)
//   R2_ACCOUNT_ID        = "" // - R2 账户 ID (明文变量) (兼容历史版本, 保留)
//   R2_ACCESS_KEY_ID     = "" // - S3 API Access Key ID (建议设为加密 Secret)
//   R2_SECRET_ACCESS_KEY = "" // - S3 API Secret Access Key (建议设为加密 Secret)
//   R2_BUCKET_NAME       = "" // - R2 存储桶名称 (明文变量)
//   R2_PUBLIC_URL        = "" // - R2 公开访问 URL, 如 https://pub-xxxx.r2.dev (明文变量)

let index_html = "https://crazypeace.github.io/file-r2-worker/index.html"

let response_header = {
  "Content-type": "text/html;charset=UTF-8;application/json",
}

if (config.cors) {
  response_header = {
    "Content-type": "text/html;charset=UTF-8;application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

async function handleRequest(request) {
  const password_value = config.password.trim();

  const requestURL = new URL(request.url)
  let path = requestURL.pathname.split("/")[1]
  path = decodeURIComponent(path);

  // 如果path为空, 返回提示
  if (!path) {
    return new Response("File R2 Worker is running.", {
      headers: { "Content-type": "text/plain;charset=UTF-8" },
      status: 200
    })
  }

  // 如果path符合password 显示操作页面index.html
  if (path == password_value) {
    let index = await fetch(index_html)
    index = await index.text()
    index = index.replace(/__PASSWORD__/gm, password_value)
    // 注入 R2 配置 (全局变量)
    index = index.replace(/__R2_ACCOUNT_ID__/gm, (typeof R2_ACCOUNT_ID !== 'undefined') ? R2_ACCOUNT_ID : '')
    index = index.replace(/__R2_S3_ENDPOINT__/gm, (typeof R2_S3_ENDPOINT !== 'undefined') ? R2_S3_ENDPOINT : '')
    index = index.replace(/__R2_ACCESS_KEY_ID__/gm, (typeof R2_ACCESS_KEY_ID !== 'undefined') ? R2_ACCESS_KEY_ID : '')
    index = index.replace(/__R2_SECRET_ACCESS_KEY__/gm, (typeof R2_SECRET_ACCESS_KEY !== 'undefined') ? R2_SECRET_ACCESS_KEY : '')
    index = index.replace(/__R2_BUCKET_NAME__/gm, (typeof R2_BUCKET_NAME !== 'undefined') ? R2_BUCKET_NAME : '')
    index = index.replace(/__R2_PUBLIC_URL__/gm, (typeof R2_PUBLIC_URL !== 'undefined') ? R2_PUBLIC_URL : '')
    if (!config.load_r2) {
      index = index.replace(/onclick='loadR2ToLocalStorage\\(\\)'/gm, "onclick='' disabled")
    }
    return new Response(index, {
      headers: response_header,
    })
  }

  // 其他路径返回 404
  return new Response("404 Not Found", {
    headers: { "Content-type": "text/plain;charset=UTF-8" },
    status: 404
  })
}

addEventListener("fetch", async event => {
  event.respondWith(handleRequest(event.request))
})
