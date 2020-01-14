"use strict";
var loadScrollSpy = function (opts) {
  opts = opts || {}
  opts["containerID"] = opts["containerID"] || "scrollspy-container";
  opts["headerSelector"] = opts["headerSelector"] || "h1, h2, h3, h4, h5, h6";
  opts["targetID"] = opts["targetID"] || "scrollspy-target";

  var container = document.getElementById(opts["containerID"]);
  var target = document.getElementById(opts["targetID"]);
  if (target == null || container == null) {
    return;
  }

  // Assume headers are continous and sort them by position.
  var headers = Array.prototype.slice.call(
    container.querySelectorAll(opts["headerSelector"]), 0
  ).sort(function (a, b) {
    return a.offsetTop - b.offsetTop;
  });
  if (headers.length === 0) {
    return;
  }

  window.onscroll = function () {
    var position = document.documentElement.scrollTop ||
      document.body.scrollTop;
    headers.forEach(function (e, i) {
      // e is higher than current position,
      // and e is last, or e's next is lower than current position.
      if (e.offsetTop <= position &&
          (i === headers.length - 1 || headers[i + 1].offsetTop > position)) {
        var oldActive = target.querySelector(".active");
        var newActive = target.querySelector(
          ["[href=\"#", e.id, "\"]"].join("")
        );
        if (oldActive !== newActive) {
          if (oldActive != null) {
            oldActive.classList.remove("active");
          }
          if (newActive != null) {
            newActive.classList.add("active");
          }
        }
      }
    });
    // If we are out of container, none is active.
    if (container.offsetTop > position ||
        container.offsetTop + container.offsetHeight < position) {
      var oldActive = target.querySelector(".active");
      if (oldActive != null) {
        oldActive.classList.remove("active");
      }
    }
  };
};
