/*
 * A script that fetching and rendering GitHub issue as comments.
 * CopyLeft (C) 2020
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.moe/)
 */
"use strict";

var GITHUB_BASE_URL = "https://github.com";
var GITHUB_API_BASE_URL = "https://api.github.com";

function buildIssuesURL(user, repo) {
  return [
    GITHUB_API_BASE_URL,
    "repos",
    user,
    repo,
    "issues?state=open"
  ].join("/");
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

function getIssues(path, callback) {
  fetchJSON(path, function (err, issues) {
    if (err != null) {
      callback(err, null);
      return;
    }
    // Remove pull requests, only show issues.
    callback(null, issues.filter(function (issue) {
      return issue["pull_request"] == null;
    }))
  });
}

function findIssueByTitle(issues, title, callback) {
  for (var i = 0; i < issues.length; ++i) {
    if (issues[i]["title"] === title) {
      callback(issues[i]);
      return;
    }
  }
  callback(null);
}

function getComments(issue, callback) {
  if (issue == null) {
    // Not a network error, just means no comment.
    callback(null, []);
    return;
  }
  fetchJSON(issue["comments_url"], function (err, comments) {
    if (err != null) {
      callback(err, null);
    }
    callback(null, [issue].concat(comments));
  });
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
    window.marked == null ? comment["body"] : marked(comment["body"]),
    "</div>",
    "</div>",
    "</div>"
  ].join("");
}

function renderComments(comments, opts) {
  var header = [
    "<header class=\"comments-header\" id=\"comments-header\">",
    comments.length !== 0 || opts["noCommentText"] == null
      ? ""
      : ("<span class=\"comment-none\">" + opts["noCommentText"] + "</span>"),
    "</header>"
  ];
  var main = ["<main class=\"comments-main\" id=\"comments-main\">"];
  var footer = [
    "<footer class=\"comments-footer\" id=\"comments-footer\">",
    "<a class=\"comments-button comment-send button\" id=\"comments-send\" ",
    "target=\"_blank\" ref=\"noreferrer noopener\" href=\"",
    comments.length === 0
      ? buildNewIssueURL(opts["user"], opts["repo"], opts["title"])
      : (comments[0]["html_url"] + "#new_comment_field"),
    "\">",
    opts["sendButtonText"],
    "</a>",
    "</footer>"
  ];
  for (var i = 0; i < comments.length; ++i) {
    main.push(renderComment(comments[i]));
  }
  main.push("</main>");
  return header.concat(main).concat(footer).join("");
}

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
  var container = document.getElementById(opts["containerID"]);
  getIssues(buildIssuesURL(opts["user"], opts["repo"]), function (err, issues) {
    if (err != null) {
      if (opts["failText"] != null) {
        container.innerHTML = [
          "<div class=\"comment-fail\" id=\"comment-fail\">",
          err.message,
          ": ",
          opts["failText"],
          "</div>"
        ].join("");
      }
      return;
    }
    findIssueByTitle(issues, opts["title"], function (issue) {
      getComments(issue, function (err, comments) {
        if (err != null) {
          if (opts["failText"] != null) {
            container.innerHTML = [
              "<div class=\"comment-fail\" id=\"comment-fail\">",
              err.message,
              ": ",
              opts["failText"],
              "</div>"
            ].join("");
          }
          return;
        }
        container.style.display = "block";
        container.innerHTML = renderComments(comments, opts);
      });
    });
  });
};

var loadCommentCount = function (opts) {
  if (opts == null) {
    return;
  }
  if (opts["containerClass"] == null) {
    return;
  }
  var containers = document.getElementsByClassName(opts["containerClass"]);
  getIssues(buildIssuesURL(opts["user"], opts["repo"]), function (err, issues) {
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
};
