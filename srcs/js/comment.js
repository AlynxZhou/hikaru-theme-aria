/**
 * A script that fetching and rendering GitHub issue as comments.
 * CopyLeft (C) 2020 - 2022
 * AlynxZhou <alynx.zhou@gmail.com> (https://alynx.one/)
 */
"use strict";

const GITHUB_BASE_URL = "https://github.com";
const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_HEADERS = {"Accept": "application/vnd.github.v3.html+json"};
const ISSUES_PER_PAGE = 70;

// If you want to debug with Inspector, don't forget to uncheck `Disable Cache`,
// or you'll reach GitHub API rate limitation soon.
const fetchJSON = (path, opts = {}) => {
  return window.fetch(path, opts).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      // fetch does not reject on HTTP error, so we do this manually.
      throw new Error("Unexpected HTTP status code " + response.status);
    }
  });
};

const buildRepoURL = (user, repo) => {
  return `${GITHUB_API_BASE_URL}/repos/${user}/${repo}`;
};

const buildNewIssueURL = (user, repo, title) => {
  return `${GITHUB_BASE_URL}/${user}/${repo}/issues/new?title=${
    window.encodeURIComponent(title)
  }#issue_body`;
};

const buildPagePath = (basePath, pageIndex) => {
  return `${basePath}?comment_page=${pageIndex}#comment-results`;
};

const calPagesLength = (totalLength, perPage) => {
  const result = totalLength / perPage;
  const floor = Math.floor(result);
  return result > floor ? floor + 1 : floor;
};

const getRepo = (path) => {
  return fetchJSON(path);
};

// Collect all issues because GitHub's API is paginated.
const getIssues = (repo) => {
  const openIssuesCount = repo["open_issues_count"];
  const pagesLength = calPagesLength(openIssuesCount, ISSUES_PER_PAGE);
  const results = [];
  for (var i = 0; i < pagesLength; ++i) {
    results.push(fetchJSON(
      `${
        repo["url"]
      }/issues?state=open&per_page=${ISSUES_PER_PAGE}&page=${i + 1}`,
      {"headers": GITHUB_API_HEADERS}
    ));
  }
  return Promise.all(results).then((results) => {
    if (results.length === 0) {
      // No issue, no page, no Promise in array and cannot reduce.
      return results;
    }
    return results.reduce((accumulator, currentValue) => {
      return accumulator.concat(currentValue);
    });
  });
};

const findIssueByTitle = (issues, title) => {
  for (const issue of issues) {
    // GitHub treats PR as issues with code, but we don't.
    if (issue["title"] === title && issue["pull_request"] == null) {
      return issue;
    }
  }
  return null;
};

const getComments = (issue, commentPage, perPage) => {
  return fetchJSON(
    `${issue["comments_url"]}?per_page=${perPage}&page=${commentPage}`,
    {"headers": GITHUB_API_HEADERS}
  ).then((comments) => {
    if (commentPage === 1) {
      // GitHub does not treat issue content as comment, but we need.
      // Anyway, the first page will have perPage + 1 comments.
      comments = [issue].concat(comments);
    }
    // If commentPage is not 1, issue body is not in comments,
    // and we need it for issue URL, so return it here.
    return [issue, comments];
  });
};

const renderPagination = (commentPage, pagesLength, opts) => {
  const result = ["<nav class=\"pagination\">"];
  for (let i = 1; i <= pagesLength; ++i) {
    if (i !== commentPage) {
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
};

const renderComment = (comment) => {
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
    "<span class=\"comment-info-datetime\">",
    "<time class=\"comment-full-datetime\" title=\"comment-created\" ",
    "itemprop=\"dateCreated datePublished\" datetime=\"",
    comment["created_at"],
    "\">",
    new Date(comment["created_at"]).toLocaleString(),
    "</time>",
    "</span>",
    "</div>",
    "<div class=\"comment-content\">",
    comment["body_html"],
    "</div>",
    "</div>",
    "</div>"
  ].join("");
};

const renderComments = (issue, comments, commentPage, pagesLength, opts) => {
  const header = ["<header class=\"comments-header\" id=\"comments-header\">"];
  if (comments.length === 0) {
    header.push("<span class=\"comment-none\">");
    header.push(opts["noCommentText"]);
    header.push("</span>");
  }
  header.push("</header>");
  const main = ["<main class=\"comments-main\" id=\"comments-main\">"];
  for (const comment of comments) {
    main.push(renderComment(comment));
  }
  if (comments.length > 0) {
    main.push(renderPagination(commentPage, pagesLength, opts));
  }
  main.push("</main>");
  const footer = ["<footer class=\"comments-footer\" id=\"comments-footer\">"];
  footer.push("<a class=\"comments-button comment-send button\" ");
  footer.push("id=\"comments-send\" target=\"_blank\" ");
  footer.push("ref=\"noreferrer noopener\" href=\"");
  if (issue == null) {
    footer.push(buildNewIssueURL(opts["user"], opts["repo"], opts["title"]));
  } else {
    footer.push(issue["html_url"] + "#new_comment_field");
  }
  footer.push("\">");
  footer.push(opts["sendButtonText"]);
  footer.push("</a>");
  footer.push("</footer>");
  return header.concat(main).concat(footer).join("");
};

const renderError = (err, opts) => {
  return `<div class="comment-fail" id="comment-fail">${
    err.message
  }<br>${opts["failText"]}</div>`;
};

/* eslint-disable-next-line no-unused-vars */
const loadComment = (opts) => {
  if (opts == null) {
    return null;
  }
  if (opts["containerID"] == null ||
      opts["user"] == null ||
      opts["repo"] == null ||
      opts["title"] == null ||
      opts["sendButtonText"] == null) {
    return null;
  }
  opts["perPage"] = opts["perPage"] || 10;
  opts["basePath"] = opts["basePath"] || "./";
  opts["failText"] = opts["failText"] || "";
  opts["noCommentText"] = opts["noCommentText"] || "";
  const container = document.getElementById(opts["containerID"]);
  if (container == null) {
    return null;
  }
  const urlParams = new window.URLSearchParams(opts["queryString"]);
  let commentPage = 1;
  let pagesLength = 1;
  if (urlParams.has("comment_page")) {
    commentPage = Number.parseInt(urlParams.get("comment_page"));
  }
  return getRepo(buildRepoURL(opts["user"], opts["repo"])).then((repo) => {
    return getIssues(repo);
  }).then((issues) => {
    const issue = findIssueByTitle(issues, opts["title"]);
    // Not a network error, just means no comment.
    if (issue == null) {
      return [issue, []];
    }
    // We skip fetching comments if there is only one body,
    // because pagesLength and currentIndex will be 0 and that's hard to handle.
    if (issue["comments"] === 0) {
      // Return the issue body and itself as the only comment.
      return [issue, [issue]];
    }
    pagesLength = calPagesLength(issue["comments"], opts["perPage"]);
    if (commentPage > pagesLength) {
      commentPage = pagesLength;
    }
    return getComments(issue, commentPage, opts["perPage"]);
  }).then(([issue, comments]) => {
    container.style.display = "block";
    container.innerHTML = renderComments(
      issue, comments, commentPage, pagesLength, opts
    );
  }).catch((error) => {
    container.style.display = "block";
    container.innerHTML = renderError(error, opts);
  });
};

/* eslint-disable-next-line no-unused-vars */
const loadCommentCount = (opts) => {
  if (opts == null) {
    return null;
  }
  if (opts["containerClass"] == null) {
    return null;
  }
  const containers = document.getElementsByClassName(opts["containerClass"]);
  if (containers.length === 0) {
    return null;
  }
  return getRepo(buildRepoURL(opts["user"], opts["repo"])).then((repo) => {
    return getIssues(repo);
  }).then((issues) => {
    for (const container of containers) {
      const title = container.getAttribute("data-comment-identifier");
      if (title == null) {
        continue;
      }
      const issue = findIssueByTitle(issues, title);
      container.innerHTML = issue == null ? 0 : issue["comments"] + 1;
    }
  }).catch((error) => {
    console.error(error);
  });
};
