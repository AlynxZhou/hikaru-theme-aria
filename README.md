ARIA
====

A Hikaru theme inspired by Kalafina's song ARIA.
------------------------------------------------

Live Demo: [喵's StackHarbor](https://sh.alynx.moe/)

# Feature

- Elegant responsive double column layout with CSS animation.
- Comment system (currently supprt [Disqus](https://disqus.com/) and a builtin GitHub issue based comment).
- Busuanzi counting.
- Hikaru local search support.
- Multi-languages support (currently `zh-Hans`, `zh-Hant-HK`, `zh-Hant-TW` and `en`, PR welcome).
- RSS feed supported.
- Dark mode supported by CSS variables.

# Before Using

Using a static website generator needs some basic knowledge, if you know nothing, Hikaru and ARIA are not your best choice. Please be sure you know Hikaru, YAML, git, Markdown and Web before continuing.

IE support has been dropped since many new features cannot be easily polyfilled for IE, for example WebP, Promise, Fetch API, CacheStorage, some amazing functions in ARIA need those features so it's better to let IE users use modern browsers like [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/) (**HIGHLY RECOMMENDED**) or [Google Chrome](https://www.google.com/chrome/).

There won't be any stable releases for ARIA, because I am not interested in maintaining different versions except the one I am using. **Without maintaining stable releases are just stable bugs instead of quality.** So keep using the latest version of ARIA and Hikaru.

[Valine](https://valine.js.org/) was dropped because it's not an open source project any more since `v1.4.0` (**it said because of "some reasons" on its homepage but never says what they are**), and it's considered not safe for saving unencrypted user email/IP address in open database. (For more detailed info, Chinese user could read [this blog](https://ttys3.net/post/hugo/please-stop-using-valine-js-comment-system-until-it-fixed-the-privacy-leaking-problem/).)

# Usage

## Clone This Repo

Clone it to `themes/aria`:

```
$ git clone https://github.com/AlynxZhou/hikaru-theme-aria.git themes/aria
```

Or if you already have a git repo in your site dir, you can add this as a submodule:

```
$ git submodule add https://github.com/AlynxZhou/hikaru-theme-aria.git themes/aria
```

## Edit Site Config

Following needs to be changed in your `site-config.yaml`.

### Change Theme to `aria`

```yaml
themeDir: aria
```

### Language Settings

Available values are `zh-Hans`, `zh-Hant-HK`, `zh-Hant-TW` and `en`. `default` is an alias of `en`.

```yaml
language: zh-Hans
```

### Search Settings

```yaml
search:
  enable: true
  path: search.json
```

### RSS Settings

```yaml
feed:
  enable: true
  path: atom.xml
  limit: 20
  hub:
  content: false
  contentLimit: 140
```

### Highlight Settings

If you want to speed up generation, you can set `enable: false` to prevent Hikaru for doing highlight, and ARIA will do highlight in browser with JavaScript.

If you don't want to generate gutter to HTML docs with Hikaru, you can set `gutter: false`, and ARIA will generate gutter in browser with JavaScript, this is useful if you don't want gutter in Feed XML.

```yaml
highlight:
  enable: true
  gutter: true
  hljs: true
```

## Copy ARIA's Config

Copy theme config to your site dir:

```
$ cp themes/aria/theme-config.yaml theme-config.yaml
```

## Edit Theme Config

Following needs to be changed in `theme-config.yaml`, not all config needs customization, you just change what you need：

### Menu Settings

If you want tags and categories links in menu, set it like following:

```yaml
menu:
  - name: home
    link: /
    icon: <i class="fas fa-home"></i>
  - name: archives
    link: archives/
    icon: <i class="fas fa-archive"></i>
  - name: categories
    link: categories/
    icon: <i class="fas fa-th-list"></i>
  - name: tags
    link: tags/
    icon: <i class="fas fa-tags"></i>
  - name: about
    link: about/
    icon: <i class="fas fa-user-edit"></i>
```

### Generating Favicon

First prepare a image of your favicon then go to  <https://realfavicongenerator.net/> to generate favicons for different browsers, then download the zip file and extract it into website's `srcs/favicons` dir (create it first). ARIA will load them.

### Website Keywords

Set the value of `keywords` to a list of keywords.

### CreativeCommons Licenses

Set it in `creativeCommons`. To keep it simple ARIA will show a link in footer. You can choose one of `by`, `by-sa`, `by-nd`, `by-nc`, `by-nc-sa`, `by-nc-nd`. Go to <https://creativecommons.org/licenses/> to learn more.

### Code Highlight

ARIA has 4 highlight theme. You can choose the value of `highlight` in one of `atom-one-dark`, `atom-one-light`, `solarized-dark`, `solarized-light`. ARIA uses  highlight.js, so if you want to add more highlight theme, go to [highlight.js' style repo](https://github.com/isagalaev/highlight.js/tree/master/src/styles) and download CSS file you need to your site's `srcs/css/` dir (just create a `css/` dir in `srcs/` that you store site source files, you can also put it into theme's `srcs/css/` but it will make git workspace dirty), then set here to your downloaded file name (without `.css` suffix, it will be add automatically).

### Custom Info

The value of `customInfo` will be shown in footer. You should not use a long string because it will break footer's format.

### Avatar

Set the value of `avatar` to your avatar's link, for example, you set `avatar: images/myavatar.png` then you needs to put you avatar to `srcs/images/myavatar.png`.

### Custom Logo

Set it like avatar, and your logo will be shown in header, which by default shows `ARIA`, or leave it blank to hide logo.

### Custom Theme Color

Theme color `color` will be used in header and footer background, and also in some browsers' title bar like Android Chrome, by default it's theme's dark. Because color starts with `#`, you need to use double quote to prevent YAML from making it a comment. If you are not sure, don't change here.

### Google Site Verification

If you want to let Google collect your website, you need to show that this is your website. When verifying, choose "Use <meta> tag" and copy the value of property `content` to `googleVerification` then re-generate and re-deploy your website.

### Website Start Year

Set `since` to your start year，if blank or the same as current year, it will only show current year, else it will show `start - current`.

### Searching Settings

To enable search, first keep sure that you added config like the 2nd step, then set `search` to `true`, it will be placed on the top of sidebar.

### Sidebar Settings

Choose between `left`, `right` and `false`, if false, sidebar will be hidden.

### Animation

Set `animate` to `true` will enable the flipping of cards (Not recommended because it's slow in some old browsers and computers).

### Busuanzi Counting

If you want to disable Busuanzi, set `busuanzi` to `false`, or it will display `website visit counting`, `website visit persion counting`, `page visit counting`.

### MathJax

[MathJax](https://www.mathjax.org/) is a library of displaying math formula in webpage, because it is large, ARIA does not contain it. If you need it, first set `enable` of `mathjax` to `true` and **set `cdn` to your MathJax CDN**, then **add `mathjax: true` to the page's front-matter in which you has formula**. Set `global` to `true` can enable MathJax in all pages but it will let other pages slow.

### Library CDN

You can use CDN with ARIA's internal lib. First set `libCDN` to `enable: true`, then add CDN link to the library. If you don't know what you are doing, just skip it.

### Social Links

First set `enable` of `social` to `true`, then add your social links under `links` like following:

```yaml
social:
  enable: true
  links:
    - name: Display Name
      link: Link Address
      icon: Font Awesome icon tag you want to use
    - name: Display Name
      link: Link Address
      icon: Font Awesome icon tag you want to use
```

Get icons in [Font Awesome](https://fontawesome.com/).

### Blogrolls

First set `enable` of `blogroll` to `true`, then add links under `links` like following:

```yaml
blogroll:
  enable: true
  links:
    - name: Display Name
      link: Link Address
      icon: Font Awesome icon tag you want to use
    - name: Display Name
      link: Link Address
      icon: Font Awesome icon tag you want to use
```

Get icons in [Font Awesome](https://fontawesome.com/).

### Comment Support

First set `comment` to `enable: true` to enable comment in all pages (except Home, Archives, Categories, Tags), then fill your Disqus Shortname. If you want to disable comment in some pages, add front-matter `comment: false` (`comment` NOT `comments`!).

If you use builtin GitHub issue based comment, first set `enable` to `true`, `user` is your GitHub user name, `repo` is your GitHub repo name. Because GitHub forces to use a paginated API, there is a `perPage` option, better to keep it default. This script only read issues from GitHub API, and has no data forward that may lose your info, it is safe.

If you use Valine, read its docs and fill options `apiID`, `apiKey`, set `enable` to `true` and custom other options.

If you enable more than one comment services, only the one shows in front of the queue will be shown (queue: builtin comment, Disqus, Valine).

### Reward

Set `enable` of `reward` to `true` to use it, then set your comment in `comment`, and set QRCode of WeChat Pay, AliPay, BitCoin like avatar. Leave blank to disable a QRCode.

Add `reward: false` to disable reward in some pages.

### Auto Excerpt

If you want to generate post excerpt at homepage automatically, you can use this. For example, `autoExcerpt: 200` will use first 200 chars (without HTML tags) as excerpt. However, if you want to get a better look, it is recommended to **place a `<!--more-->` tag to where you want, words before this tag will be used as except**.

### Custom Fonts

Set `enable` of `customFont` to `true`, then go to a webfont server like [Google Fonts](https://fonts.google.com/) (If you cannot open it, choose another), select all fonts you need, then copy the `href` property of generated `<link>` tag to `link` option. Then set different fonts to different parts.

Example like:

```yaml
customFont:
  enable: true
  link: //fonts.googleapis.com/css?family=Lato|Roboto+Condensed|Skranji|Ubuntu|Ubuntu+Mono
  all: Ubuntu # Font of <body>.
  title: Roboto Condensed # Font of title.
  subtitle: Roboto Condensed # Font of subtitle.
  main: Ubuntu # Font of main part (after the menu and before the footer).
  code: Ubuntu Mono # Font of code.
```

## Internal Style for Writing

Markdown will be compiled to HTML, and you can write HTML in a valid Markdown file. In order to help you organize your article better, here are some internal custom style class that you can use while writing.

### Center Quote

Just add `.center-quote` class to your HTML code, you will get a center-aligned quote with top and bottom border. Recommended for `<blockquote></blockquote>` tag:

```HTML
<blockquote class="center-quote">Centerquote Example</blockquote>
```

### Colorful Alert

Just add `.alert-red`, `.alert-green` or `.alert-blue` to your HTML code:

```HTML
<div class="alert-red">Alert Red Example</div>
<div class="alert-green">Alert Green Example</div>
<div class="alert-blue">Alert Blue Example</div>
```

## Custom CSS and JavaScript

If you need to cover some CSS style of ARIA, just edit `themes/aria/srcs/css/custom.styl` which will be added last.

If you need some custom JavaScript, just edit `themes/aria/srcs/js/custom.js` which will be added last.

## Update Theme

If you use custom CSS or JavaScript, please use Git to commit them first. You can only pull when your workspace is clean.

Then use `git pull` to get the newest commit, if there is a conflict, merge it manually.

Don't forget to compare `theme-config.yaml` in site's dir and theme's dir, then apply changes in example to your `theme-config.yaml` in site's dir manually.

# Coding Style

You don't need to keep 80-chars a line in templates and style files, you should keep them in good structure.

Don't forget to add space after English puctuation.

## Stylus

They should look like CSS, don't remove `{`, `}` and `;`.

For decoration's size that related to inner text, or inside other container, use `em`. (e.g. `line-height`, `text-shadow`, `ul`'s `padding-left`, link's `border-bottom` and `top`, inline element's `margin` and `padding`.)

For `font-size` or other non-relative size elements, use `rem`. (e.g. box-shadow, container's `width`, block element's `margin`, `padding` and `border`.)

Use 2-spaces indent.

## Nunjucks

Nunjucks tags should not be indented, which means they should be in the same level as their inner HTML. Consider them as HTML comment.

Use 2-spaces indent.

## JavaScript

JavaScript inside scripts tags shoule have a 2-spaces indent to it's parent `<script>` tag.

Most JavaScript code should inside `index.js`'s `documentReady()`.

IE support will be dropped so just use ES6, cheers!

Prefer to use template strings or `Array.join()` instead of `+` to concat strings.

Prefer to use `"` and escaping instead of `'`.

Don't remove `;`.

Write functions like `function name(arg1, arg2) {}`, keep space after `function`, `,` and before `{`, but not after function name. But I prefer arrow functions with const.

Use 2-spaces indent.

## YAML

Use camelCase.

Don't use inline array and object.

If you need an array to iterate, don't use object with it's key and value, use array of objects.

Use 2-spaces indent.

# Note

I created this theme with less configurations and beautiful styles. You can send PRs if you want to add some functions, if those functions are useful they will be merged soon. However, some themes says they are "simple/simpler/simplest" but infact they are ugly or other themes have so many functions and some of them in fact has little people using or just keep default, I don't want them.

For example, I will only add local search (it generates a xml of data and just use JavaScript code to query it without buying database service) to my theme because it works fine. Is there really someone paid to use Swift search or Algolia? So never send PR like *I added swift search and let some beginners use it and pay for it because they know little!* because I think local search is better for noob or beginners! if you dislike local search you can disable it (Really? You hate a simple search frame in your site?).

And refuse something like *I added a config to make avatar a square instead a circle!*, what will help if we make avatar available from TRIANGLE to HEPTADECAON? Do we really need six or more schemes in one theme? If you like, you can fork your own, but I will keep them six themes. This makes developers easy to find where to edit codes instead finding bug in some total unrelated scheme codes with `{% if schemeA %}{{ xxxxxxxxxblockxxxxxXXXXXxxxxx }}{% elif schemeB %}{{ xxxxxxxspanxxxxximgxxxxx }}{% endif %}` or `if (config(schemeA)) { .cls { a { &:hover { background: #333; } } } }`, I used to work with those codes and I know how they hurt your eyes while finding some code...

Plus, if you want add comment system, choose what people uses most like Gitment or Valine or LiveRe, no more Duoshuo or Changyan or Netease Cloud Comment because they are unstable and can make people confused or send your privacy to the government of "Other Country". I want ARIA to be easy to use, not a mess of needless choice. If only 15% or less users need a custom option, just write it into code instead of leaving a option in config file.

# License

[Apache-2.0](./LICENSE)
