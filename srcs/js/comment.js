/*
 * A script that fetching and rendering GitHub issue as comments.
 * CopyLeft (C) 2020
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.one/)
 */
"use strict";

var GITHUB_BASE_URL = "https://github.com";
var GITHUB_API_BASE_URL = "https://api.github.com";
var GITHUB_API_HEADERS = {"Accept": "application/vnd.github.v3.html+json"};

function buildRepoURL(user, repo) {
  return [
    GITHUB_API_BASE_URL,
    "/repos",
    "/",
    user,
    "/",
    repo
  ].join("");
}

function buildNewIssueURL(user, repo, title) {
  return [
    GITHUB_BASE_URL,
    "/",
    user,
    "/",
    repo,
    "/issues/new?title=",
    encodeURIComponent(title),
    "#issue_body"
  ].join("");
}

function calPagesLength(totalLength, perPage) {
  var result = totalLength / perPage;
  var floor = Math.floor(result);
  return result > floor ? floor + 1 : floor;
}

function parseQueryString(queryString) {
  var result = {};
  if (queryString.charAt(0) === "?") {
    queryString = queryString.substring(1);
  }
  var pairs = queryString.split("&");
  // Reverse loop because we only need the first value in this script.
  for (var i = pairs.length - 1; i >= 0; --i) {
    var pair = pairs[i].split("=");
    // Ignore `&a=` or `&a`.
    if (pair[1] != null && pair[1].length > 0) {
      var key = window.decodeURIComponent(pair[0]);
      var value = window.decodeURIComponent(pair[1]);
      result[key] = value;
    }
  }
  return result;
}

function fetchJSON(path, opts = {}, callback) {
  if (callback == null) {
    callback = opts;
    opts = null;
  }
  if (window.fetch != null) {
    window.fetch(path, opts).then(function (response) {
      if (response.status !== 200) {
        // fetch does not reject on HTTP error, so we do this manually.
        throw new Error("Unexpected HTTP status code " + response.status);
      }
      return response.json();
    }).then(function (json) {
      callback(null, json);
    }).catch(function (err) {
      // Catch HTTP error and fetch error.
      callback(err, null);
    });
  } else {
    var xhr = null;
    if (window.XMLHttpRequest) {
      xhr = new window.XMLHttpRequest();
    } else if (window.ActiveXObject) {
      xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
    }
    if (xhr == null) {
      callback(new Error("XMLHttpRequest is not available"), null);
      return;
    }
    xhr.onreadystatechange = function () {
      // This function will be called if readyState changed.
      // 4 is ready, and we just ignore if not ready.
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status !== 200) {
        callback(new Error("Unexpected HTTP status code " + xhr.status), null);
        return;
      }
      callback(null, JSON.parse(xhr.response));
    };
    if (opts["headers"] != null) {
      // Object.keys() is not supported by IE 9,
      // but who cares? I only support IE 11.
      var headerKeys = Object.keys(opts["headers"]);
      // But IE 11 does not support for...of! I hate it!
      for (var i = 0; i < headerKeys.length; ++i) {
        xhr.setRequestHeader(headerKeys[i], opts["headers"][headerKeys[i]]);
      }
    }
    xhr.open("GET", path, true);
    xhr.send(null);
  }
}

function getRepo(path, callback) {
  fetchJSON(path, function (err, repo) {
    if (err != null) {
      callback(err, null);
      return;
    }
    callback(null, repo);
  });
}

// An ugly way to collect all issues,
// because GitHub's API is paginated,
// but our fetch is async.
function getIssues(repo, callback) {
  var ISSUES_PER_PAGE = 70;
  var openIssuesCount = repo["open_issues_count"];
  var pagesLength = calPagesLength(openIssuesCount, ISSUES_PER_PAGE);
  var fetchedPagesCount = 0;
  var results = [];
  var lastError = null;
  for (var i = 0; i < pagesLength; ++i) {
    fetchJSON([
      repo["url"],
      "/issues",
      "?state=open&per_page=",
      ISSUES_PER_PAGE,
      "&page=",
      i
    ].join(""), {"headers": GITHUB_API_HEADERS}, function (err, issues) {
      ++fetchedPagesCount;
      // Only last error can be handled, so sad.
      if (err != null) {
        lastError = err;
      } else {
        results = results.concat(issues);
      }
      if (fetchedPagesCount === pagesLength) {
        callback(lastError, results);
      }
    });
  }
}

function findIssueByTitle(issues, title, callback) {
  for (var i = 0; i < issues.length; ++i) {
    // GitHub treats PR as issues with code, but we don't.
    if (issues[i]["title"] === title && issues[i]["pull_request"] == null) {
      callback(issues[i]);
      return;
    }
  }
  callback(null);
}

function getComments(issue, currentIndex, perPage, callback) {
  if (issue == null) {
    // Not a network error, just means no comment.
    callback(null, [], 0, 0);
    return;
  }
  // We skip fetching comments if there is only one body,
  // because pagesLength and currentIndex will be 0 and that's hard to handle.
  if (issue["comments"] === 0) {
    callback(null, [issue], 1, 1);
    return;
  }
  var pagesLength = calPagesLength(issue["comments"], perPage);
  if (currentIndex > pagesLength) {
    currentIndex = pagesLength;
  }
  fetchJSON([
    issue["url"],
    "/comments",
    "?per_page=",
    perPage,
    "&page=",
    currentIndex
  ].join(""), {"headers": GITHUB_API_HEADERS}, function (err, comments) {
    if (err != null) {
      callback(err, null);
    }
    if (currentIndex === 1) {
      // GitHub does not treat issue content as comment, but we need.
      // Anyway, the first page will have perPage + 1 comments.
      comments = [issue].concat(comments);
    }
    callback(null, comments, currentIndex, pagesLength);
  });
}

function buildPagePath(basePath, pageIndex) {
  return [basePath, "?comment_page=", pageIndex, "#comment-results"].join("");
}

function renderPagination(currentIndex, pagesLength, opts) {
  var result = ["<nav class=\"pagination\">"];
  for (var i = 1; i <= pagesLength; ++i) {
    if (i !== currentIndex) {
      result.push("<a class=\"page-number\" href=\"");
    } else {
      result.push("<a class=\"page-number current\" href=\"");
    }
    result.push(buildPagePath(opts["basePath"], i));
    result.push("\">");
    result.push(i);
    result.push("</a>");
  }
  result.push("</nav>");
  return result.join("");
}

function renderComment(comment) {
  return [
    "<div class=\"comment-result\">",
    "<div class=\"comment-avatar-container\">",
    "<img class=\"comment-avatar\" alt=\"@",
    comment["user"]["login"],
    "\" src=\"",
    comment["user"]["avatar_url"],
    "\">",
    "</div>",
    "<div class=\"comment-body-container\">",
    "<div class=\"comment-info\">",
    "<a class=\"comment-info-link\" ",
    "target=\"_blank\" ref=\"noreferrer noopener\" href=\"",
    comment["html_url"],
    "\"></a>",
    "<a class=\"comment-info-author\" ",
    "target=\"_blank\" ref=\"noreferrer noopener\" href=\"",
    comment["user"]["html_url"],
    "\">",
    comment["user"]["login"],
    "</a>",
    comment["author_association"] === "NONE"
      ? ""
      : ("<span class=\"comment-info-association\">" +
         comment["author_association"] + "</span>"),
    "<span class=\"comment-info-date\">",
    new Date(comment["updated_at"]).toLocaleString(),
    "</span>",
    "</div>",
    "<div class=\"comment-content\">",
    comment["body_html"],
    "</div>",
    "</div>",
    "</div>"
  ].join("");
}

function renderComments(comments, commentPage, pagesLength, opts) {
  var header = ["<header class=\"comments-header\" id=\"comments-header\">"];
  if (comments.length === 0) {
    header.push("<span class=\"comment-none\">");
    header.push(opts["noCommentText"]);
    header.push("</span>");
  }
  header.push("</header>");
  var main = ["<main class=\"comments-main\" id=\"comments-main\">"];
  for (var i = 0; i < comments.length; ++i) {
    main.push(renderComment(comments[i]));
  }
  if (comments.length > 0) {
    main.push(renderPagination(commentPage, pagesLength, opts));
  }
  main.push("</main>");
  var footer = ["<footer class=\"comments-footer\" id=\"comments-footer\">"];
  footer.push("<a class=\"comments-button comment-send button\" ");
  footer.push("id=\"comments-send\" target=\"_blank\" ");
  footer.push("ref=\"noreferrer noopener\" href=\"");
  if (comments.length === 0) {
    footer.push(buildNewIssueURL(opts["user"], opts["repo"], opts["title"]));
  } else {
    footer.push(comments[0]["html_url"] + "#new_comment_field");
  }
  footer.push("\">");
  footer.push(opts["sendButtonText"]);
  footer.push("</a>");
  footer.push("</footer>");
  return header.concat(main).concat(footer).join("");
}

function renderError(err, opts) {
  return [
    "<div class=\"comment-fail\" id=\"comment-fail\">",
    err.message,
    ": ",
    opts["failText"],
    "</div>"
  ].join("");
}

/* eslint-disable-next-line no-unused-vars */
var loadComment = function (opts) {
  if (opts == null) {
    return;
  }
  if (opts["containerID"] == null ||
      opts["user"] == null ||
      opts["repo"] == null ||
      opts["title"] == null ||
      opts["sendButtonText"] == null) {
    return;
  }
  opts["perPage"] = opts["perPage"] || 10;
  opts["basePath"] = opts["basePath"] || "./";
  opts["failText"] = opts["failText"] || "";
  opts["noCommentText"] = opts["noCommentText"] || "";
  // I hate IE.
  var polyfillParseInt = window.parseInt;
  if (Number.parseInt != null) {
    polyfillParseInt = Number.parseInt;
  }
  var container = document.getElementById(opts["containerID"]);
  if (container == null) {
    return;
  }
  var urlParams = parseQueryString(opts["queryString"]);
  var commentPage = 1;
  if (urlParams["comment_page"] != null) {
    commentPage = polyfillParseInt(urlParams["comment_page"]);
  }
  getRepo(buildRepoURL(opts["user"], opts["repo"]), function (err, repo) {
    if (err != null) {
      container.innerHTML = renderError(err, opts);
      return;
    }
    getIssues(repo, function (err, issues) {
      if (err != null) {
        container.innerHTML = renderError(err, opts);
        return;
      }
      findIssueByTitle(issues, opts["title"], function (issue) {
        getComments(
          issue, commentPage, opts["perPage"],
          function (err, comments, commentPage, pagesLength) {
            if (err != null) {
              container.innerHTML = renderError(err, opts);
              return;
            }
            container.style.display = "block";
            container.innerHTML = renderComments(
              comments, commentPage, pagesLength, opts
            );
          }
        );
      });
    });
  });
};

/* eslint-disable-next-line no-unused-vars */
var loadCommentCount = function (opts) {
  if (opts == null) {
    return;
  }
  if (opts["containerClass"] == null) {
    return;
  }
  var containers = document.getElementsByClassName(opts["containerClass"]);
  if (containers.length === 0) {
    return;
  }
  getRepo(buildRepoURL(opts["user"], opts["repo"]), function (err, repo) {
    if (err != null) {
      return;
    }
    getIssues(repo, function (err, issues) {
      if (err != null) {
        return;
      }
      for (var i = 0; i < containers.length; ++i) {
        var title = containers[i].getAttribute("data-comment-identifier");
        if (title == null) {
          continue;
        }
        findIssueByTitle(issues, title, function (issue) {
          // Total Length = Number of Comments + One Issue Body.
          containers[i].innerHTML = issue == null ? 0 : issue["comments"] + 1;
        });
      }
    });
  });
};
