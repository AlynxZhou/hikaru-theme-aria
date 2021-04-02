"use strict";

let lastKnownPosition = 0;
let ticking = false;

const doActive = (container, target, headers, position) => {
  headers.forEach((e, i) => {
    // e is higher than current position,
    // and e is last, or e's next is lower than current position.
    if (e.offsetTop <= position &&
        (i === headers.length - 1 || headers[i + 1].offsetTop > position)) {
      const oldActive = target.querySelector("a.active");
      const newActive = target.querySelector(`a[href="#${e.id}"]`);
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
    const oldActive = target.querySelector("a.active");
    if (oldActive != null) {
      oldActive.classList.remove("active");
    }
  }
};

/* eslint-disable-next-line no-unused-vars */
const loadScrollSpy = (opts) => {
  opts = opts || {};
  opts["containerID"] = opts["containerID"] || "scrollspy-container";
  opts["headerSelector"] = opts["headerSelector"] || "h1, h2, h3, h4, h5, h6";
  opts["targetID"] = opts["targetID"] || "scrollspy-target";

  const container = document.getElementById(opts["containerID"]);
  const target = document.getElementById(opts["targetID"]);
  if (target == null || container == null) {
    return;
  }

  // Assume headers are continous and sort them by position.
  const headers = Array.prototype.slice.call(
    container.querySelectorAll(opts["headerSelector"]), 0
  ).sort((a, b) => {
    return a.offsetTop - b.offsetTop;
  });
  if (headers.length === 0) {
    return;
  }

  window.addEventListener("scroll", (event) => {
    lastKnownPosition = document.documentElement.scrollTop ||
      document.body.scrollTop;
    if (!ticking) {
      // Kick animations out of main thread.
      window.requestAnimationFrame(() => {
        doActive(container, target, headers, lastKnownPosition);
        ticking = false;
      });
      ticking = true;
    }
  });
};
