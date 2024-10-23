import { CssToHtml } from '../cssToHtml.js'
import assert from 'assert'


assert.equal(
  new CssToHtml({
    css: `div {} div span {} custom-tag {} input {}`,
  })
    .outputHTML,

  `<div>
  <span></span>
</div>
<custom-tag></custom-tag>
<input />
`,

  'The code must be converted.'
)
assert.notEqual(
  new CssToHtml({
    css: `div {} div span {}`,
    format: false,
  }).
    outputHTML,

  `<div>
  <span></span>
</div>
`,

  'With formatting turned off, the code should look ugly.'
)
assert.equal(
  new CssToHtml({
    css: '',
  }).outputHTML,

  undefined,

  'If an empty CSS code is specified, it should return nothing.'
)
assert.equal(
  new CssToHtml({
    css: `div.some-class.class2#some-id[data-attr] {}`,
  })
    .outputHTML,

  '<div id="some-id" class="some-class class2" data-attr></div>\n',

  'The selector must be fully processed.'
)
