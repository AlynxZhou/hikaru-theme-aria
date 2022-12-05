/**
 * A script that update list group components based on scroll position to
 * indicate which link is currently active in the viewport.
 * This is an alternative to Bootstrap's Scrollspy. However, it uses `current`
 * as class name instead of `active`.
 * This version uses IntersectionObserver instead of scroll event.
 * CopyLeft (C) 2022
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.one/)
 */
"use strict";

let lastKnownPosition = 0;
let ticking = false;

const updateCurrent = (target, headings, position, opts) => {
  if (opts["offset"] !== 0) {
    position += window.innerHeight * opts["offset"];
  }
  for (let i = 0; i < headings.length; ++i) {
    const e = headings[i];
    // e is higher than current position,
    // and e is last, or e's next is lower than current position.
    if (e.offsetTop <= position &&
        (i === headings.length - 1 || headings[i + 1].offsetTop > position)) {
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
      break;
    }
  }
};

/* eslint-disable-next-line no-unused-vars */
const loadScrollSpy = (opts) => {
  opts = opts || {};
  opts["containerID"] = opts["containerID"] || "scrollspy-container";
  opts["headingSelector"] = opts["headingSelector"] || "h1, h2, h3, h4, h5, h6";
  opts["targetID"] = opts["targetID"] || "scrollspy-target";
  // Offset should between 0 and 1.
  opts["offset"] = opts["offset"] || 0;

  const container = document.getElementById(opts["containerID"]);
  const target = document.getElementById(opts["targetID"]);
  if (target == null || container == null) {
    return;
  }

  const headings = Array.prototype.slice.call(
    container.querySelectorAll(opts["headingSelector"]), 0
  ).sort((a, b) => {
    return a.offsetTop - b.offsetTop;
  });
  if (headings.length === 0) {
    return;
  }

  /**
   * A problem is that IntersectionObserver can tell us which one is going in
   * and which one is going out, but what I want is to know which one is exactly
   * above current position while the next is below current position.
   * This API cannot do this, so I only use it as a event emitter, it tells me
   * that a heading it passing the top border, so I should update the target.
   * Shift the bottom of root margin to -100% so the observing area is only the
   * top border.
   * Anyway, the problem is not that I need to calculate the current heading, is
   * that scroll event is expensive because most scroll events do not update
   * current heading.
   */
  const headingObserver = new window.IntersectionObserver((entries, observer) => {
    lastKnownPosition = document.documentElement.scrollTop ||
      document.body.scrollTop;
    if (!ticking) {
      // Kick animations out of main thread.
      window.requestAnimationFrame(() => {
        updateCurrent(target, headings, lastKnownPosition, opts);
        ticking = false;
      });
      ticking = true;
    }
  }, {
    "rootMargin": `${Math.floor(-100 * opts["offset"])}% 0% ${Math.floor(-100 * (1 - opts["offset"]))}% 0%`
  });

  const observer = new window.IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      for (const heading of headings) {
        headingObserver.observe(heading);
      }
    } else {
      for (const heading of headings) {
        headingObserver.unobserve(heading);
      }
      // Clear active item because we are outside container.
      const oldActive = target.querySelector("a.current");
      if (oldActive != null) {
        oldActive.classList.remove("current");
      }
    }
  });
  observer.observe(container);
};
