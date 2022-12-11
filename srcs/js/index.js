"use strict";

/* eslint-disable-next-line no-unused-vars */
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

/* eslint-disable-next-line no-unused-vars */
const createElementFromString = (string) => {
  const e = document.createElement("div");
  e.innerHTML = string;
  return e.firstElementChild;
};

/* eslint-disable-next-line no-unused-vars */
const elementsEach = (elements, callback) => {
  if (elements == null || callback == null) {
    return;
  }
  Array.prototype.forEach.call(elements, callback);
};

/* eslint-disable-next-line no-unused-vars */
const elementBefore = (element, before) => {
  if (element == null || before == null) {
    return;
  }
  element.insertAdjacentElement("beforebegin", before);
};

/* eslint-disable-next-line no-unused-vars */
const elementAfter = (element, before) => {
  if (element == null || before == null) {
    return;
  }
  element.insertAdjacentElement("afterend", before);
};

/* eslint-disable-next-line no-unused-vars */
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

/* eslint-disable-next-line no-unused-vars */
const slideUp = (target, duration) => {
  if (target == null) {
    return;
  }
  duration = duration || 400;
  // Ensure initial size.
  target.style.height = target.offsetHeight + "px";
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.boxSizing = "border-box";
  target.style.overflow = "hidden";
  // Don't know why but next line cannot be removed.
  /* eslint-disable-next-line no-unused-expressions */
  target.offsetHeight;
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  window.setTimeout(() => {
    target.style.display = "none";
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("box-sizing");
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
};

/* eslint-disable-next-line no-unused-vars */
const slideDown = (target, duration) => {
  if (target == null) {
    return;
  }
  duration = duration || 400;
  // If there is `display: none` added in JavaScript, remove it.
  target.style.removeProperty("display");
  const height = target.offsetHeight;
  // Ensure initial size.
  target.style.height = 0;
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.boxSizing = "border-box";
  target.style.overflow = "hidden";
  // Don't know why but next line cannot be removed.
  /* eslint-disable-next-line no-unused-expressions */
  target.offsetHeight;
  target.style.height = height + "px";
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  window.setTimeout(() => {
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("box-sizing");
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
};

/* eslint-disable-next-line no-unused-vars */
const slideToggle = (target, duration) => {
  if (target == null) {
    return;
  }
  duration = duration || 400;
  target.style.display === "none"
    ? slideDown(target, duration)
    : slideUp(target, duration);
};

/* eslint-disable-next-line no-unused-vars */
const lazyLoadWhenInside = (element, callback) => {
  // See <https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API>.
  // Use this to detect if something is inside viewport so we can prevent some
  // slow operations on webpage loading.
  // It's 2022 now, browsers of my readers should support it.
  const observer = new window.IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      callback();
      // We only need this observer once.
      observer.disconnect();
    }
  });
  observer.observe(element);
};

const formatDateTime = (elements, locales) => {
  if (elements == null || elements.length === 0) {
    return;
  }

  // See <https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat>.
  // A modern way to show date in user's format. But it only shows date by
  // default, no time.
  const formatter = new Intl.DateTimeFormat(locales, {
    "year": "numeric",
    "month": "2-digit",
    "day": "2-digit",
    "weekday": "short",
    "hour": "2-digit",
    "minute": "2-digit",
    "second": "2-digit",
    "timeZoneName": "short",
    "hour12": false
  });
  elementsEach(elements, (e, i) => {
    const date = new Date(e.getAttribute("datetime"));
    // See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts>.
    const parts = formatter.formatToParts(date);
    const obj = {};
    for (let {type, value} of parts) {
      obj[type] = value;
    }
    e.textContent = `${obj["year"]}-${obj["month"]}-${obj["day"]} ${obj["weekday"]} ${obj["hour"]}:${obj["minute"]}:${obj["second"]} ${obj["timeZoneName"]}`;
  });
};

documentReady(() => {
  // If some init functions are used for libraries that are always enabled and
  // do not depend on templating, they should be here.

  document.getElementById("back-to-top").addEventListener("click", (event) => {
    event.preventDefault();
    scrollToTop();
  });

  const rewardButton = document.getElementById("reward-button");
  const qr = document.getElementById("qr");
  if (rewardButton != null && qr != null) {
    qr.style.display = "none";
    qr.setAttribute("aria-hidden", "true");
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
  const since = yearsText.textContent;
  if (since.length === 0) {
    yearsText.textContent = current;
  } else if (since !== current) {
    yearsText.textContent = `${since} - ${current}`;
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
      menu.style.removeProperty("display");
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
    // If an image works as link, stop adding link styles to it.
    if (e.parentNode.tagName.toLowerCase() === "a") {
      e.parentNode.classList.add("img-link");
    } else {
      if (e.title) {
        elementAfter(e, createElementFromString(
          `<div class="center"><span class="caption">${e.title}</span></div>`
        ));
      }
    }
  });
});
