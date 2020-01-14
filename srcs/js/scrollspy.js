"use strict";
var loadScrollSpy = function (opts) {
  opts = opts || {}
  if (opts == null) {
    return;
  }
  opts["headerSelector"] = opts["headerSelector"] ||
    ".post-main h1, h2, h3, h4, h5, h6";
  opts["tocSelector"] = opts["tocSelector"] || ".toc";
	var headers = document.querySelectorAll(opts["headerSelector"]);
  var toc = document.querySelector(opts["tocSelector"]);
  if (toc == null || headers.length === 0) {
    return;
  }
	window.onscroll = function () {
    var position = document.documentElement.scrollTop ||
      document.body.scrollTop;
    Array.prototype.forEach.call(headers, function (e, i) {
      if (e.offsetTop <= position &&
          e.offsetTop + e.offsetHeight >= position) {
        var oldActive = toc.querySelector(".active");
        if (oldActive != null) {
          oldActive.classList.remove("active");
        }
        var newActive = toc.querySelector(["[href=\"#", e.id, "\"]"].join(""));
        if (newActive != null) {
          newActive.classList.add("active");
        }
      }
    });
  };
};
