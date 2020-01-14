"use strict";
// If some init functions are used for library which is always enabled,
// and does not depend on templating,
// init function should be written here.
var documentReady = function (callback) {
  document.readyState !== "loading"
    ? callback()
    : document.addEventListener("DOMContentLoaded", callback);
};

function slideUp(target, duration) {
  duration = duration || 400;
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.boxSizing = "border-box";
  target.style.height = target.offsetHeight + "px";
  target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  window.setTimeout(function () {
    target.style.display = "none";
    target.style.removeProperty("height");
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
}

function slideDown(target, duration) {
  duration = duration || 400;
  target.style.removeProperty("display");
  var display = window.getComputedStyle(target).display;
  if (display === "none") {
    display = "block";
  }
  target.style.display = display;
  var height = target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  target.offsetHeight;
  target.style.boxSizing = "border-box";
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.height = height + "px";
  target.style.removeProperty("padding-top");
  target.style.removeProperty("padding-bottom");
  target.style.removeProperty("margin-top");
  target.style.removeProperty("margin-bottom");
  window.setTimeout(function () {
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
}

function slideToggle(target, duration) {
  duration = duration || 400;
  return window.getComputedStyle(target).display === "none"
    ? slideDown(target, duration)
    : slideUp(target, duration);
}

documentReady(function () {
  var rewardButton = document.getElementById("reward-button");
  if (rewardButton != null) {
    rewardButton.onclick = function () {
      document.getElementById("qr").getAttribute("aria-hidden") === "true"
        ? document.getElementById("qr").setAttribute("aria-hidden", "false")
        : document.getElementById("qr").setAttribute("aria-hidden", "true");
      slideToggle(document.getElementById("qr"));
    };
  }

  document.getElementById("nav-toggle").onclick = function () {
    document.getElementById("menu").getAttribute("aria-hidden") === "true"
      ? document.getElementById("menu").setAttribute("aria-hidden", "false")
      : document.getElementById("menu").setAttribute("aria-hidden", "true");
    slideToggle(document.getElementById("menu"));
  };

  var current = new Date().getFullYear().toString();
  var since = document.getElementById("years-text").innerHTML;
  if (since.length === 0) {
    document.getElementById("years-text").innerHTML = current;
  } else if (since !== current) {
    document.getElementById("years-text").innerHTML = [
      since, " - ", current
    ].join("");
  }

  // (40em - 0.6em) * 16px
  // 40 is total size and 0.4 is scroll bar size.
  // jQuery won"t calculate scroll bar size. But CSS will.
  var minWidth = Math.round((40 - 0.4) * 16);
  // Auto hide main nav menus in small screen.
  if (window.innerWidth <= minWidth) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("menu").setAttribute("aria-hidden", "true");
    document.getElementById("nav-toggle").setAttribute(
      "aria-hidden", "false"
    );
  }
  var windowWidth = window.innerWidth;
  // Show menu again when window becomes bigger.
  window.onresize = function () {
    if (window.innerWidth > minWidth) {
      document.getElementById("menu").style.display = "";
      document.getElementById("menu").setAttribute("aria-hidden", "false");
      document.getElementById("nav-toggle").setAttribute(
        "aria-hidden", "true"
      );
    } else {
      // Android chrome fires resize when scroll down.
      // Because it hides address bar to enlarge window height.
      // To avoid it, check width.
      if (window.innerWidth !== windowWidth) {
        document.getElementById("menu").style.display = "none";
        document.getElementById("menu").setAttribute("aria-hidden", "true");
        document.getElementById("nav-toggle").setAttribute(
          "aria-hidden", "false"
        );
        windowWidth = window.innerWidth;
      }
    }
  }

  Array.prototype.forEach.call(
    document.querySelectorAll(".post img"),
    function (e, i) {
      // If an image works as link, don"t attach light gallary to it.
      if (e.parentNode.tagName !== "A") {
        if (e.title) {
          e.insertAdjacentElement(
            "afterend",
            ["<span class=\"caption\">", e.title, "</span>"].join("")
          );
        }
        var a = document.createElement("a");
        a.href = e.src;
        a.className = "gallery-item";
        e.insertAdjacentElement("afterend", a);
        a.appendChild(e);
      } else {
        e.parentNode.classList.add("img-link");
      }
    }
  );

  if (typeof lightGallery !== "undefined") {
    Array.prototype.forEach.call(
      document.querySelectorAll(".post"),
      function (e, i) {
        lightGallery(e, {"selector": ".gallery-item"});
      }
    );
  }
});
