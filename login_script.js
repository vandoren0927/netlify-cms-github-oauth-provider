const REQUIRED_ORIGIN_PATTERN = /^https?:\/\/[^,\s]+(?:,[^,\s]+)*$/;

let ORIGINS = process.env.ORIGINS;

if (!ORIGINS || typeof ORIGINS !== "string") {
  console.warn("⚠️ ORIGINS 未設定或不是字串，預設允許任意來源（僅限開發測試）");
  ORIGINS = "*";
}

const isValidOriginList = ORIGINS === "*" || ORIGINS.split(",").every(origin =>
  /^https?:\/\/[^,\s]+$/.test(origin.trim())
);

if (!isValidOriginList) {
  console.warn("⚠️ ORIGINS 格式不標準，但仍嘗試繼續。你提供的值：", ORIGINS);
  // 若想在生產環境嚴格限制，可以改為 throw Error
}

const origins = ORIGINS === "*" ? ["*"] : ORIGINS.split(",").map(o => o.trim());

module.exports = (oauthProvider, message, content) => `
<script>
(function() {
  function contains(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === "*") return true;
      if (arr[i].indexOf('*') >= 0) {
        const regex = new RegExp(arr[i].replaceAll('.', '\\\\.').replaceAll('*', '[\\\\w_-]+'))
        if (elem.match(regex) !== null) {
          return true;
        }
      } else {
        if (arr[i] === elem) {
          return true;
        }
      }
    }
    return false;
  }

  function recieveMessage(e) {
    console.log("recieveMessage %o", e);
    const normalizedOrigin = e.origin.replace('https://', 'http://').replace('http://', '');
    if (!contains(${JSON.stringify(origins)}, normalizedOrigin)) {
      console.log('Invalid origin: %s', e.origin);
      return;
    }
    window.opener.postMessage(
      'authorization:${oauthProvider}:${message}:${JSON.stringify(content)}',
      e.origin
    );
  }

  window.addEventListener("message", recieveMessage, false);
  console.log("Sending message: %o", "${oauthProvider}");
  window.opener.postMessage("authorizing:${oauthProvider}", "*");
})()
</script>`;
