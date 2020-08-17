/*
 * A local search script for [hikaru-generator-search](https://github.com/AlynxZhou/hikaru-generator-search/).
 * CopyLeft (C) 2020
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.one/)
 */

"use strict";

const SUBSTRING_OFFSET = 150;
const MAX_KEYWORDS = 30;
const MAX_DISPLAY_SLICES = 10;

const fetchJSON = (path, opts = {}) => {
  return window.fetch(path, opts).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      // fetch does not reject on HTTP error, so we do this manually.
      throw new Error("Unexpected HTTP status code " + response.status);
    }
  });
};

// Calculate how many keywords a page contains.
const findKeywords = (keywords, string) => {
  const results = [];
  if (string == null || keywords == null || keywords.length === 0) {
    return results;
  }
  string = string.toLowerCase().trim();
  if (string.length === 0) {
    return results;
  }
  for (let keyword of keywords) {
    if (keyword.length <= 0) {
      continue;
    }
    keyword = keyword.toLowerCase();
    let index = string.indexOf(keyword);
    // Find all keyword indices.
    while (index >= 0) {
      // Save original content because keyword is case insensitive.
      results.push({
        "keyword": string.substring(index, index + keyword.length),
        "index": index
      });
      index = string.indexOf(keyword, index + keyword.length);
    }
  }
  return results;
};

const buildSortedSlices = (prop) => {
  const slices = [];
  // Sorting slice array is hard so sort index array instead.
  prop["contentKeywords"].sort(function (a, b) {
    return a["index"] - b["index"];
  });
  // Get content slice position.
  for (
    let i = 0;
    i < prop["contentKeywords"].length && i < MAX_DISPLAY_SLICES;
    ++i
  ) {
    let start = prop["contentKeywords"][i]["index"] - SUBSTRING_OFFSET;
    let end = prop["contentKeywords"][i]["index"] +
              prop["contentKeywords"][i]["keyword"].length +
              SUBSTRING_OFFSET;
    start = Math.max(start, 0);
    if (start === 0) {
      end = SUBSTRING_OFFSET +
            prop["contentKeywords"][i]["keyword"].length +
            SUBSTRING_OFFSET;
    }
    end = Math.min(end, prop["dataContent"].length);
    slices.push({"start": start, "end": end});
  }
  return slices;
};

const mergeSlices = (slices) => {
  const mergedSlices = [];
  if (slices.length === 0) {
    return mergedSlices;
  }
  mergedSlices.push(slices[0]);
  for (const slice of slices) {
    // If two slice have common part, merge them.
    if (mergedSlices[mergedSlices.length - 1]["end"] >= slice["start"]) {
      if (slice["end"] > mergedSlices[mergedSlices.length - 1]["end"]) {
        mergedSlices[mergedSlices.length - 1]["end"] = slice["end"];
      }
    } else {
      mergedSlices.push(slice);
    }
  }
  return mergedSlices;
};

const buildHighlightedTitle = (prop) => {
  // Do a fastUniqKeywords so the regex won't be too long.
  const regexKeywords = fastUniqKeywords(
    prop["titleKeywords"].filter((tk) => {
      return tk["keyword"].length !== 0;
    }).map((tk) => {
      return tk["keyword"];
    })
  );
  // Replace all in one time to prevent it from matching <strong> tag.
  const regex = new RegExp(regexKeywords.join("|"), "gi");
  // `$&` is the matched part of RegExp.
  return prop["dataTitle"].replace(
    regex, "<strong class=\"search-keyword\">$&</strong>"
  );
};

const buildHighlightedContent = (prop, mergedSlices) => {
  const matchedContents = mergedSlices.map((slice) => {
    return prop["dataContent"].substring(slice["start"], slice["end"]);
  });
  // Do a fastUniqKeywords so the regex won't be too long.
  const regexKeywords = fastUniqKeywords(
    prop["contentKeywords"].filter((ck) => {
      return ck["keyword"].length !== 0;
    }).map((ck) => {
      return ck["keyword"];
    })
  );
  // Replace all in one time to prevent it from matching <strong> tag.
  const regex = new RegExp(regexKeywords.join("|"), "gi");
  return matchedContents.map((content) => {
    // `$&` is the matched part of RegExp.
    return content.replace(
      regex, "<strong class=\"search-keyword\">$&</strong>"
    );
  }).join("…");
};

const buildDataProps = (data, keywords) => {
  const dataProps = [];
  for (const d of data) {
    // We don't search HTML tags so strip it.
    const prop = {
      "contentKeywords": [],
      "titleKeywords": [],
      "dataTitle": (d["title"] || "").trim(),
      "highlightedTitle": null,
      "dataContent": (d["content"] || "").trim().replace(/<\/?[^>]+>/gi, ""),
      "highlightedContent": null,
      "dataURL": d["url"] || ""
    };
    // Only match articles with valid titles and contents.
    if (prop["dataTitle"].length + prop["dataContent"].length !== 0) {
      prop["contentKeywords"] = findKeywords(keywords, prop["dataContent"]);
      prop["titleKeywords"] = findKeywords(keywords, prop["dataTitle"]);
    }
    if (prop["contentKeywords"].length + prop["titleKeywords"].length !== 0) {
      prop["highlightedTitle"] = buildHighlightedTitle(prop);
      prop["highlightedContent"] = buildHighlightedContent(
        prop, mergeSlices(buildSortedSlices(prop))
      );
      dataProps.push(prop);
    }
  }
  return dataProps;
};

// The more keywords a page contains, the higher this page ranks.
const sortDataProps = (dataProps) => {
  dataProps.sort(function (a, b) {
    return -(
      (a["contentKeywords"].length + a["titleKeywords"].length) -
      (b["contentKeywords"].length + b["titleKeywords"].length)
    );
  });
};

// Keywords are all strings so this function works.
const fastUniqKeywords = (array) => {
  const seen = {};
  const result = [];
  let j = 0;
  for (const s of array) {
    if (!seen[s]) {
      seen[s] = true;
      result[j++] = s;
    }
  }
  return result;
};

const parseKeywords = (queryString) => {
  const urlParams = new window.URLSearchParams(queryString);
  if (!urlParams.has("q")) {
    return [];
  }
  const query = urlParams.get("q").trim();
  if (query.length <= 0) {
    return [];
  }
  return fastUniqKeywords(query.split(/[\s-+]+/));
};

const renderDataProps = (dataProps) => {
  const res = [];
  for (const prop of dataProps) {
    res.push("<li><a href=\"");
    res.push(prop["dataURL"]);
    res.push("\" class=\"search-result-title\">");
    res.push(prop["highlightedTitle"]);
    res.push("</a>");
    res.push("<p class=\"search-result-content\">…");
    res.push(prop["highlightedContent"]);
    res.push("…</p>");
  }
  return res;
};

/* eslint-disable-next-line no-unused-vars */
const loadSearch = (opts) => {
  if (opts == null) {
    return;
  }
  if (opts["paths"] == null ||
      opts["queryString"] == null ||
      opts["containerID"] == null) {
    return;
  }
  opts["failText"] = opts["failText"] || "";
  opts["noResultText"] = opts["noResultText"] || "";
  const container = document.getElementById(opts["containerID"]);
  if (container == null) {
    return;
  }
  container.style.display = "block";
  const header = [];
  const footer = [];
  let keywords = parseKeywords(opts["queryString"]);
  if (keywords.length === 0) {
    container.innerHTML = opts["noResultText"];
    return;
  }
  if (keywords.length > MAX_KEYWORDS) {
    keywords = keywords.slice(0, MAX_KEYWORDS);
    header.push("<span>Keywords more than ");
    header.push(MAX_KEYWORDS);
    header.push(" are sliced.</span>");
  }
  header.push("<ul class=\"search-result-list\">");
  footer.push("</ul>");
  return Promise.all(opts["paths"].map((path) => {
    return fetchJSON(path);
  })).then((jsons) => {
    const data = jsons.map((json) => {
      return json["data"];
    }).reduce((accumulator, currentValue) => {
      return accumulator.concat(currentValue);
    });
    const dataProps = buildDataProps(data, keywords);
    sortDataProps(dataProps);
    container.innerHTML = dataProps.length === 0
      ? opts["noResultText"]
      : header.concat(renderDataProps(dataProps)).concat(footer).join("");
  }).catch((error) => {
    container.innerHTML = `${error.message}<br>${opts["failText"]}`;
  });
};
