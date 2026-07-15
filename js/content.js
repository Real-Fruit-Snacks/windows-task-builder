/* Adds a click-to-copy button to any framed .code-block example.
   Works on plain-http / file:// where the async clipboard API is unavailable. */
(function () {
  "use strict";

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(new Error("copy failed")); }
      catch (err) { reject(err); }
      finally { document.body.removeChild(ta); }
    });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".code-block"), function (block) {
    var bar = block.querySelector(".code-lang");
    var code = block.querySelector(".code-body code") || block.querySelector(".code-body") ||
               block.querySelector("pre code") || block.querySelector("code");
    if (!bar || !code || bar.querySelector(".copy-code")) return;
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "copy-code"; btn.textContent = "copy";
    btn.setAttribute("aria-label", "Copy to clipboard");
    btn.addEventListener("click", function () {
      copyText(code.textContent).then(function () {
        btn.textContent = "copied"; btn.classList.add("copied");
        setTimeout(function () { btn.textContent = "copy"; btn.classList.remove("copied"); }, 1600);
      }, function () {
        btn.textContent = "failed";
        setTimeout(function () { btn.textContent = "copy"; }, 1600);
      });
    });
    bar.appendChild(btn);
  });
})();
