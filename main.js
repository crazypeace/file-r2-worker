let res

let apiSrv = window.location.pathname
let password_value = document.querySelector("#passwordText").value
// let apiSrv = "https://journal.crazypeace.workers.dev"
// let password_value = "journaljournal"

// 这是默认行为, 在不同的index.html中可以设置为不同的行为
// This is default, you can define it to different funciton in different theme index.html
let buildValueItemFunc = buildValueTxt

function shorturl() {
  if (document.querySelector("#longURL").value == "") {
    alert("Url cannot be empty!")
    return
  }
  
  // 短链中不能有空格
  // key can't have space in it
  document.getElementById('keyPhrase').value = document.getElementById('keyPhrase').value.replace(/\s/g, "-");

  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "add", url: document.querySelector("#longURL").value, key: document.querySelector("#keyPhrase").value, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 成功生成短链 Succeed
    if (res.status == "200") {
      let keyPhrase = res.key;
      let valueLongURL = document.querySelector("#longURL").value;
      // save to localStorage
      localStorage.setItem(keyPhrase, valueLongURL);
      // add to urlList on the page
      addUrlToList(keyPhrase, valueLongURL)

      document.getElementById("result").innerHTML = window.location.protocol + "//" + window.location.host + "/" + res.key;
    } else {
      document.getElementById("result").innerHTML = res.error;
    }

    // 弹出消息窗口 Popup the result
    var modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();

  }).catch(function (err) {
    alert("Unknow error. Please retry!");
    console.log(err);
  })
}

function copyurl(id, attr) {
  let target = null;

  if (attr) {
    target = document.createElement('div');
    target.id = 'tempTarget';
    target.style.opacity = '0';
    if (id) {
      let curNode = document.querySelector('#' + id);
      target.innerText = curNode[attr];
    } else {
      target.innerText = attr;
    }
    document.body.appendChild(target);
  } else {
    target = document.querySelector('#' + id);
  }

  try {
    let range = document.createRange();
    range.selectNode(target);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    // console.log('Copy success')
  } catch (e) {
    console.log('Copy error')
  }

  if (attr) {
    // remove temp target
    target.parentElement.removeChild(target);
  }
}

function loadUrlList() {
  // 清空列表
  let urlList = document.querySelector("#urlList")
  while (urlList.firstChild) {
    urlList.removeChild(urlList.firstChild)
  }

  // 文本框中的长链接
  let longUrl = document.querySelector("#longURL").value
  // console.log(longUrl)

  // 遍历localStorage
  let len = localStorage.length
  // console.log(+len)
  for (; len > 0; len--) {
    let keyShortURL = localStorage.key(len - 1)
    let valueLongURL = localStorage.getItem(keyShortURL)

    // 如果长链接为空，加载所有的localStorage
    // If the long url textbox is empty, load all in localStorage
    // 如果长链接不为空，加载匹配的localStorage
    // If the long url textbox is not empty, only load matched item in localStorage
    if (longUrl == "" || (longUrl == valueLongURL)) {
      addUrlToList(keyShortURL, valueLongURL)
    }
  }
}

function addUrlToList(shortUrl, longUrl) {
  let urlList = document.querySelector("#urlList")

  let child = document.createElement('div')
  child.classList.add("mb-3", "list-group-item")

  let keyItem = document.createElement('div')
  keyItem.classList.add("input-group")

  // 删除按钮 Remove item button
  let delBtn = document.createElement('button')
  delBtn.setAttribute('type', 'button')  
  delBtn.classList.add("btn", "btn-danger", "rounded-bottom-0")
  delBtn.setAttribute('onclick', 'deleteShortUrl(\"' + shortUrl + '\")')
  delBtn.setAttribute('id', 'delBtn-' + shortUrl)
  delBtn.innerText = "X"
  keyItem.appendChild(delBtn)

  // 查询访问次数按钮 Query visit times button
  let qryCntBtn = document.createElement('button')
  qryCntBtn.setAttribute('type', 'button')
  qryCntBtn.classList.add("btn", "btn-info")
  qryCntBtn.setAttribute('onclick', 'queryVisitCount(\"' + shortUrl + '\")')
  qryCntBtn.setAttribute('id', 'qryCntBtn-' + shortUrl)
  qryCntBtn.innerText = "?"
  keyItem.appendChild(qryCntBtn)

  // 短链接信息 Short url
  let keyTxt = document.createElement('span')
  keyTxt.classList.add("form-control", "rounded-bottom-0")
  keyTxt.innerText = window.location.protocol + "//" + window.location.host + "/" + shortUrl
  keyItem.appendChild(keyTxt)

  // 显示二维码按钮
  let qrcodeBtn = document.createElement('button')  
  qrcodeBtn.setAttribute('type', 'button')
  qrcodeBtn.classList.add("btn", "btn-info")
  qrcodeBtn.setAttribute('onclick', 'buildQrcode(\"' + shortUrl + '\")')
  qrcodeBtn.setAttribute('id', 'qrcodeBtn-' + shortUrl)
  qrcodeBtn.innerText = "QR"
  keyItem.appendChild(qrcodeBtn)
  
  child.appendChild(keyItem)

  // 插入一个二级码占位
  let qrcodeItem = document.createElement('div');
  qrcodeItem.setAttribute('id', 'qrcode-' + shortUrl)
  child.appendChild(qrcodeItem)

  // 长链接信息 Long url
  child.appendChild(buildValueItemFunc(longUrl))

  urlList.append(child)
}

function clearLocalStorage() {
  localStorage.clear()
}

async function deleteShortUrl(delKeyPhrase) {
  // 按钮状态 Button Status
  document.getElementById("delBtn-" + delKeyPhrase).disabled = true;
  document.getElementById("delBtn-" + delKeyPhrase).innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

  // 先尝试删除 R2 文件 (file-r2 theme 提供 r2DeleteObject)
  try {
    let longUrl = localStorage.getItem(delKeyPhrase);
    if (longUrl && typeof r2DeleteObject === 'function') {
      let u = new URL(longUrl);
      let key = decodeURIComponent(u.pathname.slice(1)); // "/abc.webp" → "abc.webp"
      if (key) {
        await r2DeleteObject(key);
      }
    }
  } catch (e) {
    console.log('R2 delete failed:', e);
  }

  // 从KV中删除 Remove item from KV
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "del", key: delKeyPhrase, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 成功删除 Succeed
    if (res.status == "200") {
      // 从localStorage中删除
      localStorage.removeItem(delKeyPhrase)

      // 加载localStorage
      loadUrlList()

      document.getElementById("result").innerHTML = "Delete Successful"
    } else {
      document.getElementById("result").innerHTML = res.error;
    }

    // 弹出消息窗口 Popup the result
    var modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();

  }).catch(function (err) {
    alert("Unknow error. Please retry!");
    console.log(err);
  })
}

function queryVisitCount(qryKeyPhrase) {
  // 按钮状态 Button Status
  document.getElementById("qryCntBtn-" + qryKeyPhrase).disabled = true;
  document.getElementById("qryCntBtn-" + qryKeyPhrase).innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

  // 从KV中查询 Query from KV
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qry", key: qryKeyPhrase + "-count", password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 成功查询 Succeed
    if (res.status == "200") {
      document.getElementById("qryCntBtn-" + qryKeyPhrase).innerHTML = res.url;
    } else {
      document.getElementById("result").innerHTML = res.error;
      // 弹出消息窗口 Popup the result
      var modal = new bootstrap.Modal(document.getElementById('resultModal'));
      modal.show();
    }

  }).catch(function (err) {
    alert("Unknow error. Please retry!");
    console.log(err);
  })
}

function query1KV() {
  let qryKeyPhrase = document.getElementById("keyForQuery").value;
  if (qryKeyPhrase == "") {
    return
  }

  // 从KV中查询 Query from KV
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qry", key: qryKeyPhrase, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    res = myJson;

    // 成功查询 Succeed
    if (res.status == "200") {
      document.getElementById("longURL").value = res.url;
      document.getElementById("keyPhrase").value = qryKeyPhrase;
      // 触发input事件
      document.getElementById("longURL").dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true,
      }))
    } else {
      document.getElementById("result").innerHTML = res.error;
      // 弹出消息窗口 Popup the result
      var modal = new bootstrap.Modal(document.getElementById('resultModal'));
      modal.show();
    }

  }).catch(function (err) {
    alert("Unknow error. Please retry!");
    console.log(err);
  })
}

function loadKV() {
  //清空本地存储
  clearLocalStorage(); 

  // 从KV中查询, cmd为 "qryall", 查询全部
  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "qryall", password: password_value })
  }).then(function (response) {    
    return response.json();
  }).then(function (myJson) {
    res = myJson;
    // 成功查询 Succeed
    if (res.status == "200") {

      // 遍历kvlist
      res.kvlist.forEach(item => {      
        keyPhrase = item.key;
        valueLongURL = item.value;
        // save to localStorage
        localStorage.setItem(keyPhrase, valueLongURL);  
      });

    } else {
      document.getElementById("result").innerHTML = res.error;
      // 弹出消息窗口 Popup the result
      var modal = new bootstrap.Modal(document.getElementById('resultModal'));
      modal.show();
    }
  }).catch(function (err) {
    alert("Unknow error. Please retry!");
    console.log(err);
  })
}

// ====== load R2 to KV: 列出 R2 全部文件, 写入 KV ======
async function loadR2ToKV() {
  const cfg = getR2Config();
  if (!cfg.accountId || !cfg.bucketName) {
    alert('R2 配置未就绪');
    return;
  }

  const btn = document.getElementById('loadR2Btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 读取 R2...';

  try {
    // 列出 bucket 中所有对象
    const { url } = await _signedFetch('GET', '', [
      'list-type=2',
      'max-keys=1000'
    ], cfg);

    const resp = await fetch(url);
    const xml = await resp.text();

    // 解析 XML 提取所有 Key
    const keys = [];
    const re = /<Key>(.*?)<\/Key>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      keys.push(m[1]);
    }

    if (keys.length === 0) {
      btn.disabled = false;
      btn.innerHTML = 'load R2 to KV';
      alert('R2 中没有文件');
      return;
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 写入 KV (0/' + keys.length + ')...';

    // 逐个写入 KV
    let success = 0;
    let fail = 0;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const r2Url = cfg.publicUrl + '/' + encodeURIComponent(key);

      try {
        const result = await fetch(apiSrv, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: "add", url: r2Url, key: key, password: password_value })
        }).then(r => r.json());

        if (result.status == "200") {
          success++;
          // 同步写入 localStorage
          localStorage.setItem(key, r2Url);
        } else {
          fail++;
        }
      } catch (e) {
        fail++;
      }

      // 更新进度
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 写入 KV (' + (i + 1) + '/' + keys.length + ')...';
    }

    btn.disabled = false;
    btn.innerHTML = 'load R2 to KV';
    loadUrlList(); // 刷新列表

    document.getElementById("result").innerHTML = 'R2 → KV 完成<br>成功: ' + success + '<br>失败: ' + fail;
    var modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = 'load R2 to KV';
    alert('读取 R2 失败: ' + err.message);
  }
}

// 生成二维码
function buildQrcode(shortUrl) {
  // 感谢项目 https://github.com/lrsjng/jquery-qrcode
  var options = {
    // render method: 'canvas', 'image' or 'div'
    render: 'canvas',

    // version range somewhere in 1 .. 40
    minVersion: 1,
    maxVersion: 40,

    // error correction level: 'L', 'M', 'Q' or 'H'
    ecLevel: 'Q',

    // offset in pixel if drawn onto existing canvas
    left: 0,
    top: 0,

    // size in pixel
    size: 256,

    // code color or image element
    fill: '#000',

    // background color or image element, null for transparent background
    background: null,

    // content
    // 要转换的文本
    text: window.location.protocol + "//" + window.location.host + "/" + shortUrl,

    // corner radius relative to module width: 0.0 .. 0.5
    radius: 0,

    // quiet zone in modules
    quiet: 0,

    // modes
    // 0: normal
    // 1: label strip
    // 2: label box
    // 3: image strip
    // 4: image box
    mode: 0,

    mSize: 0.1,
    mPosX: 0.5,
    mPosY: 0.5,

    label: 'no label',
    fontname: 'sans',
    fontcolor: '#000',

    image: null
  };
  $("#qrcode-" + shortUrl.replace(/(:|\.|\[|\]|,|=|@)/g, "\\$1").replace(/(:|\#|\[|\]|,|=|@)/g, "\\$1") ).empty().qrcode(options);
}

function buildValueTxt(longUrl) {
  let valueTxt = document.createElement('div')
  valueTxt.classList.add("form-control", "rounded-top-0")
  valueTxt.innerText = longUrl
  return valueTxt
}

document.addEventListener('DOMContentLoaded', function() {
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
  });

  loadUrlList();
});

// ====== R2 S3 Client + file-r2 上传逻辑 ======
// S3 Signature V4 签名、文件名查重、presigned URL 生成、上传到 R2
// 依赖 index.html 中的隐藏输入框: #r2AccountId, #r2AccessKeyId, #r2SecretAccessKey, #r2BucketName, #r2PublicUrl

// ====== 读取 R2 配置 ======
function getR2Config() {
  return {
    accountId:      document.getElementById('r2AccountId').value,
    accessKeyId:    document.getElementById('r2AccessKeyId').value,
    secretAccessKey:document.getElementById('r2SecretAccessKey').value,
    bucketName:     document.getElementById('r2BucketName').value,
    publicUrl:      document.getElementById('r2PublicUrl').value,
  };
}

// ====== S3 Signature V4 辅助函数 (Web Crypto API) ======
function _toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _hmacSha256(key, message) {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const msgData = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', cryptoKey, msgData);
}

async function _sha256Hex(data) {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return _toHex(hash);
}

function _formatDateStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 8);
}

function _formatAmzDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15) + 'Z';
}

function _uriEncode(str, encodeSlash) {
  let result = encodeURIComponent(str);
  result = result.replace(/%2F/g, encodeSlash ? '%2F' : '/');
  result = result.replace(/\*/g, '%2A');
  return result;
}

// ====== 签名请求 (通用) ======
async function _signedFetch(method, path, queryParams, cfg) {
  const host = cfg.accountId + '.r2.cloudflarestorage.com';
  const now = new Date();
  const dateStamp = _formatDateStamp(now);
  const amzDate = _formatAmzDate(now);
  const credentialScope = dateStamp + '/auto/s3/aws4_request';

  // 合并所有查询参数, 按 key 字母序排序 (S3 签名要求)
  const authParams = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': cfg.accessKeyId + '/' + credentialScope,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': '900',
    'X-Amz-SignedHeaders': 'host'
  };
  (queryParams || []).forEach(function(p) {
    var idx = p.indexOf('=');
    authParams[decodeURIComponent(p.substring(0, idx))] = decodeURIComponent(p.substring(idx + 1));
  });

  var sortedKeys = Object.keys(authParams).sort();
  var canonicalQsParts = sortedKeys.map(function(k) {
    return _uriEncode(k, true) + '=' + _uriEncode(authParams[k], true);
  });
  var canonicalQs = canonicalQsParts.join('&');

  var canonicalUri = '/' + cfg.bucketName + path;
  var canonicalHeaders = 'host:' + host + '\n';
  var signedHeaders = 'host';
  var canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQs + '\n' + canonicalHeaders + '\n' + signedHeaders + '\nUNSIGNED-PAYLOAD';

  var requestHash = await _sha256Hex(canonicalRequest);
  var stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + credentialScope + '\n' + requestHash;

  var kDate = await _hmacSha256('AWS4' + cfg.secretAccessKey, dateStamp);
  var kRegion = await _hmacSha256(kDate, 'auto');
  var kService = await _hmacSha256(kRegion, 's3');
  var kSigning = await _hmacSha256(kService, 'aws4_request');
  var signature = _toHex(await _hmacSha256(kSigning, stringToSign));

  var url = 'https://' + host + canonicalUri + '?' + canonicalQs + '&X-Amz-Signature=' + signature;
  return { url: url, host: host };
}

// ====== 检查 R2 中是否存在某个 key ======
async function r2KeyExists(key) {
  const cfg = getR2Config();
  const { url } = await _signedFetch('GET', '', [
    'list-type=2',
    'prefix=' + _uriEncode(key, false),
    'max-keys=100'
  ], cfg);

  const resp = await fetch(url);
  const xml = await resp.text();

  // 解析 XML 查找精确匹配的 key
  const keys = [];
  const re = /<Key>(.*?)<\/Key>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    keys.push(m[1]);
  }
  return keys.indexOf(key) !== -1;
}

// ====== 生成 presigned PUT URL (带过期时间) ======
async function r2GeneratePresignedPutUrl(key, expiresIn) {
  const cfg = getR2Config();
  expiresIn = expiresIn || 900;
  const host = cfg.accountId + '.r2.cloudflarestorage.com';
  const now = new Date();
  const dateStamp = _formatDateStamp(now);
  const amzDate = _formatAmzDate(now);
  const credentialScope = dateStamp + '/auto/s3/aws4_request';

  // 按 key 字母序排序 (S3 签名要求)
  var authParams = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': cfg.accessKeyId + '/' + credentialScope,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host'
  };

  var sortedKeys = Object.keys(authParams).sort();
  var canonicalQs = sortedKeys.map(function(k) {
    return _uriEncode(k, true) + '=' + _uriEncode(authParams[k], true);
  }).join('&');

  var canonicalUri = '/' + cfg.bucketName + '/' + _uriEncode(key, true);
  var canonicalHeaders = 'host:' + host + '\n';
  var signedHeaders = 'host';
  var canonicalRequest = 'PUT\n' + canonicalUri + '\n' + canonicalQs + '\n' + canonicalHeaders + '\n' + signedHeaders + '\nUNSIGNED-PAYLOAD';

  var requestHash = await _sha256Hex(canonicalRequest);
  var stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + credentialScope + '\n' + requestHash;

  var kDate = await _hmacSha256('AWS4' + cfg.secretAccessKey, dateStamp);
  var kRegion = await _hmacSha256(kDate, 'auto');
  var kService = await _hmacSha256(kRegion, 's3');
  var kSigning = await _hmacSha256(kService, 'aws4_request');
  var signature = _toHex(await _hmacSha256(kSigning, stringToSign));

  return 'https://' + host + canonicalUri + '?' + canonicalQs + '&X-Amz-Signature=' + signature;
}

// ====== 删除 R2 对象 ======
async function r2DeleteObject(key) {
  const cfg = getR2Config();
  const { url } = await _signedFetch('DELETE', '/' + _uriEncode(key, true), [], cfg);
  const resp = await fetch(url, { method: 'DELETE' });
  return resp.ok;
}

// ====== 随机字符串 ======
function r2RandomString(len) {
  len = len || 6;
  var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  var result = '';
  for (var i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ====== 生成不重名的文件名 ======
// 如果 R2 中已存在同名文件, 在扩展名前加 _随机串
// 最多重试 5 次
async function r2ResolveFilename(filename) {
  var finalKey = filename;
  var exists = await r2KeyExists(finalKey);

  if (exists) {
    var dotIndex = filename.lastIndexOf('.');
    var namePart = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
    var extPart = dotIndex > 0 ? filename.substring(dotIndex) : '';

    for (var attempt = 0; attempt < 5; attempt++) {
      finalKey = namePart + '_' + r2RandomString(6) + extPart;
      var stillExists = await r2KeyExists(finalKey);
      if (!stillExists) {
        return { key: finalKey, renamed: true };
      }
    }
    return { key: null, renamed: false, error: '无法生成唯一文件名, 请重试' };
  }

  return { key: finalKey, renamed: false };
}

// ====== 状态变量 ======
let r2UploadUrl = null;   // presigned PUT URL
let r2PublicUrl = null;   // R2 公开 URL
let r2FinalKey  = null;   // 最终文件名 key

// ====== 文件选择事件 ======
const inputFile = document.getElementById('input_file');
const uploadBtn = document.getElementById('uploadBtn');

inputFile.addEventListener('change', function() {
  if (this.files.length > 0) {
    uploadBtn.disabled = false;
    uploadBtn.innerText = '上传到 R2: ' + this.files[0].name;
    // 重置状态
    document.getElementById('longURL').value = '';
    document.getElementById('keyPhrase').value = '';
  } else {
    uploadBtn.disabled = true;
    uploadBtn.innerText = '上传到 R2';
  }
});

// ====== 步骤 1: 查重 + 生成 presigned URL (前端直连 R2) ======
async function uploadToR2() {
  const file = inputFile.files[0];
  if (!file) {
    alert('请先选择文件');
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 检查文件名...';

  try {
    // 1. 检查 R2 中是否重名, 重名则自动生成新文件名
    var result = await r2ResolveFilename(file.name);
    if (!result.key) {
      resetUploadBtn();
      showResult(result.error || '文件名解析失败');
      return;
    }

    r2FinalKey = result.key;
    var cfg = getR2Config();
    r2PublicUrl = cfg.publicUrl + '/' + encodeURIComponent(r2FinalKey);

    if (result.renamed) {
      uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 重名, 已改为 ' + r2FinalKey;
      await new Promise(function(r) { setTimeout(r, 800); });
    }

    // 2. 前端生成 presigned PUT URL
    uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 生成上传链接...';
    r2UploadUrl = await r2GeneratePresignedPutUrl(r2FinalKey);

    // 3. 直传 R2
    uploadFileToR2(file, r2UploadUrl);

  } catch (err) {
    resetUploadBtn();
    showResult('上传准备失败: ' + err.message);
  }
}

// ====== 步骤 2: 直传 R2（带进度条）======
function uploadFileToR2(file, uploadUrl) {
  uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> 上传中...';

  // 显示进度条
  const progressWrap = document.getElementById('progressWrap');
  const progressBar  = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  progressBar.innerText = '0%';
  progressText.innerText = '';

  const xhr = new XMLHttpRequest();
  xhr.open('PUT', uploadUrl, true);
  // 不设 Content-Type, 避免触发 CORS 预检 (Content-Type 不在签名中, R2 不会校验)

  // 上传进度
  xhr.upload.addEventListener('progress', function(e) {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = pct + '%';
      progressBar.innerText = pct + '%';
      progressText.innerText = formatBytes(e.loaded) + ' / ' + formatBytes(e.total);
    }
  });

  // 上传完成
  xhr.addEventListener('load', function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      // 步骤 3: 上传完成, 填入字段
      onUploadDone(r2FinalKey, r2PublicUrl);
    } else {
      resetUploadBtn();
      progressWrap.style.display = 'none';
      showResult('R2 上传失败, HTTP ' + xhr.status);
    }
  });

  xhr.addEventListener('error', function() {
    resetUploadBtn();
    progressWrap.style.display = 'none';
    showResult('R2 上传网络错误');
  });

  xhr.send(file);
}

// ====== 步骤 3: 上传完成, 填入字段 + 自动保存到 KV ======
function onUploadDone(key, r2Url) {
  // 填入结果
  document.getElementById('longURL').value = r2Url;
  document.getElementById('keyPhrase').value = key;

  // 进度条变绿
  const progressBar = document.getElementById('progressBar');
  progressBar.classList.remove('progress-bar-animated');
  progressBar.classList.add('bg-success');
  progressBar.innerText = '上传完成 ✓';

  uploadBtn.innerText = '上传完成';

  // 弹窗显示 R2 URL
  showResult(r2Url);

  // 自动保存到 KV (静默)
  shorturlSilent();
}

// ====== 静默保存到 KV (不弹窗) ======
function shorturlSilent() {
  if (document.querySelector("#longURL").value == "") return;

  document.getElementById('keyPhrase').value = document.getElementById('keyPhrase').value.replace(/\s/g, "-");

  fetch(apiSrv, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: "add", url: document.querySelector("#longURL").value, key: document.querySelector("#keyPhrase").value, password: password_value })
  }).then(function (response) {
    return response.json();
  }).then(function (myJson) {
    if (myJson.status == "200") {
      localStorage.setItem(myJson.key, document.querySelector("#longURL").value);
      addUrlToList(myJson.key, document.querySelector("#longURL").value);
    }
  }).catch(function (err) {
    console.log(err);
  });
}

// ====== 工具函数 ======
function resetUploadBtn() {
  uploadBtn.disabled = false;
  uploadBtn.innerText = '上传到 R2';
}

function showResult(msg) {
  document.getElementById('result').innerHTML = msg;
  var modal = new bootstrap.Modal(document.getElementById('resultModal'));
  modal.show();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  var k = 1024;
  var sizes = ['B', 'KB', 'MB', 'GB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}
