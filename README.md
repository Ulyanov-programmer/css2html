Special thanks to the author of the idea [akopyl](https://github.com/anatolykopyl).

## Installation

> **Attention!** <br>
> This library works with the APIs provided by `node.js` .

```shell
npm i css2html
```

```shell
yarn add css2html
```

```js
import { CssToHtml } from 'css2html';

let result = new CssToHtml({ css: 'div{}' });

console.log(result.outputHTML);
```

## What is this?

It converts this:

```css
section#some-id {
  /* {{ This is text inside }} */
  --attr-title: 'Title';

  background: red;
  color: aliceblue;
}
section#some-id header[data-attribute='v'] {
  /* {{ This is the header text }} */

  color: blue;
}
section#some-id span {
  /* 
    {{ Text of span }} 
    Text after 
  */

  color: peru;
}
```

To this:

```html
<section id="some-id" title="Title">
  This is text inside
  <header data-attribute="v">This is the header text</header>
  <span>Text of span</span>
  Text after
</section>
```

## How to use this?

### Elements

You can create an element via selector:

```css
div.classname#id[attr-1][attr-2='v'] {
  /* None of the parts of a selector are mandatory */
  /* But at least something needs to be left */
}
```

```html
<!-- Result -->
<div id="id" class="classname" attr-1 attr-2="v"></div>
```

**Nesting** is supported:

```css
div {
}
div span {
}
```

```html
<div>
  <span></span>
</div>
```

If you want to **add styles** but **not add elements** (that is, so that some selectors are ignored), add one of the following to the selector:

- Pseudo-class
- Pseudo-element
- One of these selectors: `*`, `+`, `>`, `||`, `|`, `~`
- Or wrap it in an [`@at-rule`](https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule)

Example - these selectors will be **ignored**:

```css
> div.classname#id[attr-1][attr-2='v'] {
}
div::before {
  /* Yes, and this one too */
}
div:not(:has(span)) {
  /* And this one too! */
}
@container (width > 1440px) {
  div[data-a='This element will be ignored too'] {
  }
}
```

### Text and attributes

Attributes can be set via a selector (_it can be useful for styling_), or you can use a [custom property](https://developer.mozilla.org/en-US/docs/Web/CSS/--*):

```css
/* In a selector */
a[title='Title!'] {
  /* Specific attribute */
  --attr-href: './index.html';
  --data-attribute: 'Value';

  /* And massively! */
  --attrs: 'target="_self" rel="noopener"';
}
```

```html
<a
  title="Title!"
  data-attribute="Value"
  href="./index.html"
  target="_self"
  rel="noopener"
>
</a>
```

You can add text inside the tag using **comments** or **variables**:

```css
/* The old way is not recommended for use */
div {
  --text-before: 'The battle ';
  --text: 'continues';
  --text-after: ' again';
}
/* New way, recommended for use. Curly braces are required! */
section {
  /* 
    The battle
    {{ continues }}
    again
  */
}
```

```html
The battle <div>continues</div> again

The battle
<section> continues </section>
again
```

## API

The very minimum to run looks like this:

```js
// This code outputs to the terminal/console the result of processing the simplest CSS from the single tag.
import { CssToHtml } from 'css2html';

let result = new CssToHtml({ css: 'div{}' });

console.log(result.outputHTML);
```

### Writing to a file

To write in a file, add the `write` parameter:
<br>
(_Attention! The entire file will be **overwritten**_)

```js
new CssToHtml({
  ...,
  write: {
    in: "your_path_to_html_file",
  },
})
```

#### Overwriting a part of a file

Using the `after` and/or `before` parameters, you will not overwrite the entire file, but **specify the area** to be overwritten.
<br>
You can omit one of these parameters or not specify them at all.

Without `after` and `before` parameters:

```js
new CssToHtml({
  ...,
  write: {
    in: "your_path_to_html_file",
  },
})
```

```html
<some-html-content>
  <div>Your content from CSS</div>
</some-html-content>

<!-- to... -->

<div>Your content from CSS</div>
```

With `after` and `before` parameters:

```js
new CssToHtml({
  ...,
  write: {
    ...,
    after: '<some-html-content>',
    before: '</some-html-content>',
  },
})
```

```html
<some-html-content>
  <div>Your content from CSS</div>
</some-html-content>

<!-- Without changes -->

<some-html-content>
  <div>Your content from CSS</div>
</some-html-content>
```

#### Formatting

Before giving you html, it is formatted by the [html-format](https://www.npmjs.com/package/html-format) library.
You can either enable or disable formatting:

```js
new CssToHtml({
  format: true, // default value
});
```

### If you find a bug, please create an issue [here](https://github.com/Ulyanov-programmer/css2html/issues).

### If this project was useful to you, you can give it a ★ in [repository](https://github.com/Ulyanov-programmer/css2html).
