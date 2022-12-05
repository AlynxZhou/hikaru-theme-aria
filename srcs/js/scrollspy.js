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
    // This heading is higher than current position,
    // and it is the last, or its next is lower than current position.
    if (headings[i].offsetTop <= position &&
        (i === headings.length - 1 || headings[i + 1].offsetTop > position)) {
      const oldActive = target.querySelector("a.current");
      const newActive = target.querySelector(`a[href="#${headings[i].id}"]`);
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
   * Scroll event is too expensive for ScrollSpy, because not all scroll events
   * trigger section change. IntersectionObserver is good, but it also has a
   * problem: it has only two states, an element is reported as either "a little
   * bit inside" or "totally outside" an area. But that is not OK for ScrollSpy,
   * you should not update when a section is "a little bit inside" the area,
   * it will behave differently in two scrolling directions. To keep it behave
   * the same in two directions, when webpage goes up, you should set a section
   * to current if it is "a little bit outside" the area, and when webpage goes
   * down, you should set a section to current if it is "a little bit inside"
   * the area.
   *
   * A tricky workaround is setting the root margins so the actually checking
   * area becomes the top border of it (let the sum be -100% in one direction).
   * Then if webpage goes up, "a little bit inside" the line is also "a little
   * bit outside" the line.
   *
   * But keep in mind that Markdown does not have sections, we are using
   * headings, a section is from current heading's top to next heading's top,
   * and you can only get event about headings. That has no difference when
   * webpage goes up, because a heading is "a little bit outside" the line also
   * means its section is "a little bit outside" the line. But when webpages
   * goes down, a heading is "a little bit inside" the line does not means its
   * section is "a little bit inside" the line, you are too late. Instead, a
   * heading is "totally outside" the line means its previous section is "a
   * little bit inside" the line. But then you need to get the previous heading,
   * which IntersectionObserver does not tell you.
   *
   * So I decide to calculate current section by myself, like what I do for the
   * scroll event version. Then use IntersectionObserver to detect section
   * change, so I won't do too much calculating compared with scroll event. Also
   * it's harmless to update on both events, extra states from
   * IntersectionObserver does not changes the final result, so I don't need to
   * check scrolling direction.
   */
  const headingObserver = new window.IntersectionObserver(
    (entries, observer) => {
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
    }
  );

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
