/* Site analytics for The Pugs' Data Viz Studies (GoatCounter: no cookies, no personal data).
   Loaded by the home page and every study page. Set CODE to the GoatCounter site code
   (the "mycode" part of mycode.goatcounter.com). Empty = analytics off. */
(function () {
  var CODE = "pugdataviz";
  if (!CODE || location.hostname !== "leonagata24.github.io") return; // live site only: no local or preview hits
  var s = document.createElement("script");
  s.async = true;
  s.dataset.goatcounter = "https://" + CODE + ".goatcounter.com/count";
  s.src = "https://gc.zgo.at/count.js";
  document.head.appendChild(s);
})();
