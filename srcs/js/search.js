/*
 * A local search script for [hikaru-generator-search](https://github.com/AlynxZhou/hikaru-generator-search/).
 * CopyLeft (C) 2020
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.moe/)
 */

"use strict";

var SUBSTRING_OFFSET = 150;
var MAX_KEYWORDS = 30;
var MAX_DISPLAY_SLICES = 10;

function fetchJSON(path, callback) {
  if (window.fetch != null) {
    fetch(path).then(function (response) {
      if (response.status !== 200) {
        callback(new Error(response.status), null);
        return;
      }
      response.json().then(function (json) {
        callback(null, json);
      });
    });
  } else {
    var xhr = null;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }
    if (xhr == null) {
      console.error("Your broswer does not support XMLHttpRequest!");
      return;
    }
    xhr.onreadystatechange = function () {
      // 4 is ready.
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status !== 200) {
        callback(new Error(xhr.status), null);
        return;
      }
      callback(null, JSON.parse(xhr.response));
    };
    xhr.open("GET", path, true);
    xhr.send(null);
  }
}

// Calculate how many keywords a page contains.
function findKeywords(keywords, prop) {
  for (var i = 0; i < keywords.length; ++i) {
    var keyword = keywords[i].toLowerCase();
    if (keyword.length <= 0) {
      continue;
    }
    var indexContent = prop["dataContent"].toLowerCase().indexOf(keyword);
    // Find all keyword indices.
    while (indexContent >= 0) {
      // Save original content because keyword is case insensitive.
      prop["contentKeywords"].push({
        "keyword": prop["dataContent"].substring(
          indexContent, indexContent + keyword.length
        ),
        "index": indexContent
      });
      indexContent = prop["dataContent"].toLowerCase().indexOf(
        keyword, indexContent + keyword.length
      );
    }
    var indexTitle = prop["dataTitle"].toLowerCase().indexOf(keyword);
    while (indexTitle >= 0) {
      prop["titleKeywords"].push({
        "keyword": prop["dataTitle"].substring(
          indexTitle, indexTitle + keyword.length
        ),
        "index": indexTitle
      });
      indexTitle = prop["dataTitle"].toLowerCase().indexOf(
        keyword, indexTitle + keyword.length
      );
    }
  }
}

function buildSortedSlices(prop) {
  var slices = [];
  // Sorting slice array is hard so sort index array instead.
  prop["contentKeywords"].sort(function (a, b) {
    return a["index"] - b["index"]
  });
  // Get content slice position.
  for (
    var i = 0;
    i < prop["contentKeywords"].length && i < MAX_DISPLAY_SLICES;
    ++i
  ) {
    var start = prop["contentKeywords"][i]["index"] - SUBSTRING_OFFSET;
    var end = prop["contentKeywords"][i]["index"] +
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
}

function mergeSlices(slices) {
  var mergedSlices = [];
  if (slices.length === 0) {
    return mergedSlices;
  }
  mergedSlices.push(slices[0])
  for (var i = 1; i < slices.length; ++i) {
    // If two slice have common part, merge them.
    if (mergedSlices[mergedSlices.length - 1]["end"] >= slices[i]["start"]) {
      if (slices[i]["end"] > mergedSlices[mergedSlices.length - 1]["end"]) {
        mergedSlices[mergedSlices.length - 1]["end"] = slices[i]["end"];
      }
    } else {
      mergedSlices.push(slices[i]);
    }
  }
  return mergedSlices;
}

function buildHighlightedTitle(prop) {
  var matchedTitle = prop["dataTitle"];
  var regexKeywords = [];
  for (var i = 0; i < prop["titleKeywords"].length; ++i) {
    if (prop["titleKeywords"][i]["keyword"].length > 0) {
      regexKeywords.push(prop["titleKeywords"][i]["keyword"])
    }
  }
  // Replace all in one time to prevent it from matching <strong> tag.
  var regex = new RegExp(regexKeywords.join("|"), "gi");
  // `$&` is the matched part of RegExp.
  matchedTitle = matchedTitle.replace(
    regex, "<strong class=\"search-keyword\">$&</strong>"
  );
  return matchedTitle;
}

function buildHighlightedContent(prop, mergedSlices) {
  var matchedContents = [];
  for (var i = 0; i < mergedSlices.length; ++i) {
    matchedContents.push(prop["dataContent"].substring(
      mergedSlices[i]["start"], mergedSlices[i]["end"]
    ));
  }
  var regexKeywords = [];
  for (var i = 0; i < prop["contentKeywords"].length; ++i) {
    if (prop["contentKeywords"][i]["keyword"].length > 0) {
      regexKeywords.push(prop["contentKeywords"][i]["keyword"]);
    }
  }
  var regex = new RegExp(regexKeywords.join("|"), "gi");
  for (var i = 0; i < matchedContents.length; i++) {
    matchedContents[i] = matchedContents[i].replace(
      regex, "<strong class=\"search-keyword\">$&</strong>"
    );
  }
  return matchedContents.join("…");
}

function buildDataProps(data, keywords) {
  var dataProps = [];
  for (var i = 0; i < data.length; ++i) {
    // We don't search HTML tags so strip it.
    var prop = {
      "contentKeywords": [],
      "titleKeywords": [],
      "dataTitle": (data[i]["title"] || "").trim(),
      "highlightedTitle": null,
      "dataContent": (data[i]["content"] || "").trim().replace(
        /<\/?[^>]+>/gi, ""
      ),
      "highlightedContent": null,
      "dataURL": data[i]["url"] || ""
    };
    // Only match articles with valid titles and contents.
    if (prop["dataTitle"].length + prop["dataContent"].length > 0) {
      findKeywords(keywords, prop);
    }
    if (prop["contentKeywords"].length + prop["titleKeywords"].length > 0) {
      prop["highlightedTitle"] = buildHighlightedTitle(prop);
      var mergedSlices = mergeSlices(buildSortedSlices(prop));
      prop["highlightedContent"] = buildHighlightedContent(prop, mergedSlices);
      dataProps.push(prop);
    }
  }
  return dataProps;
}

// The more keywords a page contains, the higher this page ranks.
function sortDataProps(dataProps) {
  dataProps.sort(function (a, b) {
    return -(
      (a["contentKeywords"].length + a["titleKeywords"].length) -
      (b["contentKeywords"].length + b["titleKeywords"].length)
    );
  });
}

// Keywords are all strings so this function works.
function fastUniqKeywords(array) {
  var seen = {};
  var result = [];
  var j = 0;
  for (var i = 0; i < array.length; i++) {
    if (seen[array[i]] !== true) {
      seen[array[i]] = true;
      result[j++] = array[i];
    }
  }
  return result;
}

function parseKeywords(queryString) {
  var urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("q")) {
    return [];
  }
  var query = urlParams.get('q').trim();
  if (query.length <= 0) {
    return [];
  }
  return fastUniqKeywords(query.split(/[\s-\+]+/));
}

function renderDataProps(dataProps) {
  var res = [];
  for (var i = 0; i < dataProps.length; ++i) {
    res.push("<li><a href=\"")
    res.push(dataProps[i]["dataURL"]);
    res.push("\" class=\"search-result-title\">");
    res.push(dataProps[i]["highlightedTitle"]);
    res.push("</a>");
    res.push("<p class=\"search-result-content\">…");
    res.push(dataProps[i]["highlightedContent"]);
    res.push("…</p>");
  }
  return res;
}

var loadSearch = function (opts) {
  if (opts == null) {
    return;
  }
  if (opts["paths"] == null ||
      opts["queryString"] == null ||
      opts["containerID"] == null) {
    return;
  }
  opts["noResultText"] = opts["noResultText"] || ""
  var container = document.getElementById(opts["containerID"]);
  container.style.display = "block";
  var header = [];
  var dataProps = [];
  var footer = [];
  var keywords = parseKeywords(opts["queryString"]);
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
  var hasErr = null;
  opts["paths"].forEach(function (path) {
    fetchJSON(path, function (err, json) {
      if (err != null) {
        hasErr = err;
        if (opts["failText"] != null) {
          container.innerHTML = opts["failText"] + container.innerHTML;
        }
        return;
      }
      var data = null;
      if (Array.isArray(json)) {
        data = json;
      } else {
        data = json["data"];
      }
      dataProps = dataProps.concat(buildDataProps(data, keywords));
      sortDataProps(dataProps);
      container.innerHTML = dataProps.length === 0
        ? opts["noResultText"]
        : header.concat(renderDataProps(dataProps)).concat(footer).join("");
      if (hasErr != null && opts["failText"] != null) {
        container.innerHTML = opts["failText"] + container.innerHTML;
      }
    });
  });
}
