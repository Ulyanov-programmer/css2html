import { CssToHtml } from '../cssToHtml.js'
import assert from 'assert'


assert.equal(
  new CssToHtml({
    css: `div[attr-1][data-attr][role="button"] {}`,
  })
    .outputHTML,

  '<div attr-1 data-attr role="button"></div>\n',

  'Attributes in the selector must be processed.'
)
assert.equal(
  new CssToHtml({
    css: `
div {
--attr-href: #;
--attr-role: "button";
--data-attr: 15;
--attrs: "tabindex="0" data-v";
}`,
  })
    .outputHTML,

  '<div href="#" role="button" data-attr="15" tabindex="0" data-v></div>\n',

  'Attributes in the rule must be processed.'
)