/**
 * A script that update list group components based on scroll position to
 * indicate which link is currently active in the viewport.
 * This is an alternative to Bootstrap's Scrollspy. However, it uses `current`
 * as class name instead of `active`.
 * CopyLeft (C) 2022
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.one/)
 */
"use strict";

let lastKnownPosition = 0;
let ticking = false;

const doActive = (container, target, headers, position) => {
  headers.forEach((e, i) => {
    // e is higher than current position,
    // and e is last, or e's next is lower than current position.
    if (e.offsetTop <= position &&
        (i === headers.length - 1 || headers[i + 1].offsetTop > position)) {
      const oldActive = target.querySelector("a.current");
      const newActive = target.querySelector(`a[href="#${e.id}"]`);
      if (oldActive !== newActive) {
        if (oldActive != null) {
          oldActive.classList.remove("current");
        }
        if (newActive != null) {
          newActive.classList.add("current");
        }
      }
    }
  });
  // If we are out of container, none is active.
  if (container.offsetTop > position ||
      container.offsetTop + container.offsetHeight < position) {
    const oldActive = target.querySelector("a.current");
    if (oldActive != null) {
      oldActive.classList.remove("current");
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

  const onScroll = (event) => {
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
  };

  // See <https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API>.
  // `scroll` event is expensive, use this to detect if something is inside
  // viewport.
  // It's 2022 now, browsers of my readers should support it.
  const observer = new window.IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      // See <https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener>.
      // It's 2022 now and `options.passive` should be supported on browsers of
      // my readers.
      window.addEventListener("scroll", onScroll, {"passive": true});
    } else {
      window.removeEventListener("scroll", onScroll);
    }
  }, {"threshold": 0});
  observer.observe(container);
};
