"use strict";

const documentReady = (callback) => {
  if (callback == null) {
    return;
  }
  if (
    document.readyState === "complete" || document.readyState === "interactive"
  ) {
    window.setTimeout(callback, 0);
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
};

const createElementFromString = (string) => {
  const e = document.createElement("div");
  e.innerHTML = string;
  return e.firstElementChild;
};

const elementsEach = (elements, callback) => {
  if (elements == null || callback == null) {
    return;
  }
  return Array.prototype.forEach.call(elements, callback);
};

const elementBefore = (element, before) => {
  if (element == null || before == null) {
    return;
  }
  element.insertAdjacentElement("beforebegin", before);
};

const elementAfter = (element, before) => {
  if (element == null || before == null) {
    return;
  }
  element.insertAdjacentElement("afterend", before);
};

const scrollToTop = (opts) => {
  opts = opts || {};
  opts["duration"] = opts["duration"] || 400;
  opts["offset"] = opts["offset"] || 0;
  const oldOffset = document.documentElement.scrollTop ||
    document.body.scrollTop;
  const startMs = window.performance.now();
  const frame = (currentMs) => {
    // Time based frame step.
    const currentOffset = (
      1 - (currentMs - startMs) / opts["duration"]
    ) * (oldOffset - opts["offset"]);
    if (currentOffset <= opts["offset"]) {
      // Finished animation!
      document.documentElement.scrollTop = opts["offset"];
      document.body.scrollTop = opts["offset"];
    } else {
      document.documentElement.scrollTop = currentOffset;
      document.body.scrollTop = currentOffset;
      // Call next animation!
      window.requestAnimationFrame(frame);
    }
  };
  window.requestAnimationFrame(frame);
};

const slideUp = (target, duration) => {
  if (target == null) {
    return;
  }
  duration = duration || 400;
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.boxSizing = "border-box";
  target.style.height = target.offsetHeight + "px";
  // Don't know why but next line cannot be removed.
  /* eslint-disable-next-line no-unused-expressions */
  target.offsetHeight;
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  target.style.overflow = "hidden";
  window.setTimeout(() => {
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
};

const slideDown = (target, duration) => {
  if (target == null) {
    return;
  }
  duration = duration || 400;
  target.style.removeProperty("display");
  let display = window.getComputedStyle(target).display;
  if (display === "none") {
    display = "block";
  }
  target.style.display = display;
  const height = target.offsetHeight;
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  // Don't know why but next line cannot be removed.
  /* eslint-disable-next-line no-unused-expressions */
  target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.boxSizing = "border-box";
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.height = height + "px";
  target.style.removeProperty("padding-top");
  target.style.removeProperty("padding-bottom");
  target.style.removeProperty("margin-top");
  target.style.removeProperty("margin-bottom");
  window.setTimeout(() => {
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
};

const slideToggle = (target, duration) => {
  if (target == null) {
    return;
  }
  duration = duration || 400;
  return window.getComputedStyle(target).display === "none"
    ? slideDown(target, duration)
    : slideUp(target, duration);
};

documentReady(() => {
  // If some init functions are used for library which is always enabled,
  // and does not depend on templating,
  // init function should be written here.

  document.getElementById("back-to-top").addEventListener("click", (event) => {
    scrollToTop();
  });

  const rewardButton = document.getElementById("reward-button");
  const qr = document.getElementById("qr");
  if (rewardButton != null) {
    rewardButton.addEventListener("click", () => {
      qr.getAttribute("aria-hidden") === "true"
        ? qr.setAttribute("aria-hidden", "false")
        : qr.setAttribute("aria-hidden", "true");
      slideToggle(qr);
    });
  }

  const menu = document.getElementById("menu");
  const navToggle = document.getElementById("nav-toggle");
  navToggle.addEventListener("click", () => {
    menu.getAttribute("aria-hidden") === "true"
      ? menu.setAttribute("aria-hidden", "false")
      : menu.setAttribute("aria-hidden", "true");
    slideToggle(menu);
  });

  const yearsText = document.getElementById("years-text");
  const current = new Date().getFullYear().toString();
  const since = yearsText.innerHTML;
  if (since.length === 0) {
    yearsText.innerHTML = current;
  } else if (since !== current) {
    yearsText.innerHTML = `${since} - ${current}`;
  }

  // (40em - 0.6em) * 16px
  // 40 is total size and 0.4 is scroll bar size.
  // Don't forget calculate scroll bar size.
  const minWidth = Math.round((40 - 0.4) * 16);
  let windowWidth = window.innerWidth;
  // Auto hide main nav menus in small screen.
  if (windowWidth <= minWidth) {
    menu.style.display = "none";
    menu.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-hidden", "false");
  }
  // Show menu again when window becomes bigger.
  window.addEventListener("resize", (event) => {
    if (window.innerWidth > minWidth) {
      menu.style.display = "";
      menu.setAttribute("aria-hidden", "false");
      navToggle.setAttribute("aria-hidden", "true");
    } else {
      // Android chrome fires resize when scroll down.
      // Because it hides address bar to enlarge window height.
      // To avoid it, check width.
      if (window.innerWidth !== windowWidth) {
        menu.style.display = "none";
        menu.setAttribute("aria-hidden", "true");
        navToggle.setAttribute("aria-hidden", "false");
        windowWidth = window.innerWidth;
      }
    }
  });

  elementsEach(document.querySelectorAll("article.post img"), (e, i) => {
    // If an image works as link, don't attach light gallary to it.
    if (e.parentNode.tagName !== "A") {
      if (e.title) {
        elementAfter(e, createElementFromString(
          `<div class="center"><span class="caption">${e.title}</span></div>`
        ));
      }
      const a = document.createElement("a");
      a.href = e.src;
      a.className = "gallery-item";
      elementAfter(e, a);
      a.appendChild(e);
    } else {
      e.parentNode.classList.add("img-link");
    }
  });

  if (typeof lightGallery !== "undefined") {
    elementsEach(document.querySelectorAll("article.post"), (e, i) => {
      /* eslint-disable-next-line no-undef */
      lightGallery(e, {"selector": ".gallery-item"});
    });
  }

  /* eslint-disable-next-line no-undef */
  loadScrollSpy({
    "containerID": "scrollspy-container",
    "targetID": "scrollspy-target",
    "headerSelector": "h1, h2, h3, h4, h5, h6"
  });
});
