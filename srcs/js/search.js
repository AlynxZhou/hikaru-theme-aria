/*
 * A local search script for [hikaru-generator-search](https://github.com/AlynxZhou/hikaru-generator-search/).
 * CopyLeft (C) 2015-2019
 * Joseph Pan <http://github.com/wzpan>
 * Shuhao Mao <http://github.com/maoshuhao>
 * Edited by MOxFIVE <http://github.com/MOxFIVE>
 * Rewrited by AlynxZhou <https://alynx.xyz/>
 *   Cleaned: Use native JavaScript instead of jQuery. Split functions.
 *   Fixed: Mark all keywords found in content and title.
 *   Optimized: Sort result by the number of keyword found.
 */

"use strict";

var SUBSTRING_OFFSET = 150;
var MAX_KEYWORDS = 30;
var MAX_DISPLAY_SLICES = 10;

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

function buildSortedDataProps(data, keywords) {
  var dataProps = [];
  for (var i = 0; i < data.length; ++i) {
    // We don't search HTML tags so strip it.
    var prop = {
      "contentKeywords": [],
      "titleKeywords": [],
      "dataTitle": data[i]["title"].trim(),
      "dataContent": data[i]["content"].trim().replace(/<\/?[^>]+>/gi, ""),
      "dataURL": data[i]["url"]
    };
    // Only match articles with valid titles and contents.
    if (prop["dataTitle"].length + prop["dataContent"].length > 0) {
      findKeywords(keywords, prop);
    }
    if (prop["contentKeywords"].length + prop["titleKeywords"].length > 0) {
      dataProps.push(prop);
    }
  }
  // The more keywords a page contains, the higher this page ranks.
  dataProps.sort(function (a, b) {
    return -(
      (a["contentKeywords"].length + a["titleKeywords"].length) -
      (b["contentKeywords"].length + b["titleKeywords"].length)
    );
  });
  return dataProps;
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

function searchResult(queryString, data) {
  var urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("q")) {
    return "";
  }
  var query = urlParams.get('q').trim();
  if (query.length <= 0) {
    return "";
  }
  var keywords = fastUniqKeywords(query.split(/[\s-\+]+/));
  var li = [];
  if (keywords.length > MAX_KEYWORDS) {
    keywords = keywords.slice(0, MAX_KEYWORDS);
    li.push("<span>Keywords more than ");
    li.push(MAX_KEYWORDS);
    li.push(" are sliced.</span>");
  }
  var dataProps = buildSortedDataProps(data, keywords);
  if (dataProps.length === 0) {
    return "";
  }
  li.push("<ul class=\"search-result-list\">");
  for (var i = 0; i < dataProps.length; ++i) {
    // Show search results.
    li.push("<li><a href=\"")
    li.push(dataProps[i]["dataURL"]);
    li.push("\" class=\"search-result-title\">");
    li.push(buildHighlightedTitle(dataProps[i]));
    li.push("</a>");
    li.push("<p class=\"search-result-content\">...");
    var slices = buildSortedSlices(dataProps[i])
    var mergedSlices = mergeSlices(slices);
    // Highlight keyword.
    li.push(buildHighlightedContent(dataProps[i], mergedSlices));
    li.push("...</p>");
  }
  li.push("</ul>");
  return li.join("");
}

function ajax(url, callback) {
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
      console.error("XMLHttpRequest failed!");
      return;
    }
    callback(xhr);
  };
  xhr.open("GET", url, true);
  xhr.send(null);
}

var loadSearch = function (path, queryString, containerId) {
  ajax(path, function (xhr) {
    var data = [];
    if (xhr.responseXML) {
      var xmlDoc = xhr.responseXML;
      var entries = xmlDoc.getElementsByTagName("entry");
      for (var i = 0; i < entries.length; i++) {
        data.push({
          "title": entries[i].getElementsByTagName("title")[0].innerHTML || "",
          "content": entries[i].getElementsByTagName("content")[0].innerHTML ||
                     "",
          "url": entries[i].getElementsByTagName("url")[0].innerHTML || ""
        });
      }
    } else {
      var xhrJSON = JSON.parse(xhr.response);
      for (var i = 0; i < xhrJSON.length; i++) {
         // Hexo Generator Search does not fill a key when a page is blank.
        data.push({
          "title": xhrJSON[i]["title"] || "",
          "content": xhrJSON[i]["content"] || "",
          "url": xhrJSON[i]["url"] || ""
        });
      }
    }
    var resultContainer = document.getElementById(containerId);
    resultContainer.style.display = "block";
    resultContainer.innerHTML = searchResult(queryString, data);
  });
}
