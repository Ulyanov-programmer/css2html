import { createParser } from 'css-selector-parser'

const selectorParser = createParser()
const validVariableNamesForAttributes = [
  'attr',
  'attrs',
  'data',
]
const selfCloseTags = [
  'input',
  'br',
  'hr',
  'col',
  'link',
  'area',
  'img',
  'base',
  'embed',
  'keygen',
  'menuitem',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]

export class ElementOfHtml {
  #string = ''
  get string() {
    if (this.#string) return this.#string

    this.#addTextBefore()
    this.#createTagString()
    this.#addText()
    this.#addInnerElements()
    this.#createEndString()
    this.#addTextAfter()

    return this.#string
  }
  #selfCloseTag = false
  parentSelector = ''
  fullSelector
  selfSelector
  innerElements = []
  classes = []
  attributes = ''

  constructor(entryRule, selector) {
    this.fullSelector = selector

    this.#setParentAndSelfSelector(this.fullSelector)

    this.#parseSelector(selector)

    this.#setAttributes(entryRule)
    this.#setText(entryRule)
    this.#setTextFromComment(entryRule)
    this.#setTag()
    this.#setId()
    this.#setClasses()
  }

  #createTagString() {
    let endOfString = this.#selfCloseTag ? ' />' : ' >'

    this.#string +=
      '<' +
      this.tag +
      this.id +
      this.classes +
      this.attributes +
      endOfString
  }
  #addTextBefore() {
    this.#string += this.textBefore ? `${this.textBefore}` : ''
  }
  #addTextAfter() {
    this.#string += this.textAfter ? `${this.textAfter}` : ''
  }
  #addText() {
    this.#string += this.text ? `${this.text}` : ''
  }
  #addInnerElements() {
    if (this.innerElements.length <= 0) return

    if (!this.innerElements[0].textBefore) {
      this.#string += '\n'
    }

    for (let innerElement of this.innerElements ?? []) {
      this.#string += innerElement.string

      if (!innerElement.string?.match(/\n *$/gm)) {
        this.#string += '\n'
      }
    }
  }
  #createEndString() {
    if (this.#selfCloseTag) return

    this.#string += '</' + this.tag + '>'
  }
  searchInnerElements(elements, searchIndex) {
    for (++searchIndex; searchIndex < elements.length; searchIndex++) {
      if (this.#isFirstLevelChild(elements[searchIndex])) {
        this.innerElements.push(elements[searchIndex])
      }
      else if (!this.#isInnerElement(elements[searchIndex])) {
        break
      }
    }
  }

  #setTag() {
    this.tag = this.tag ?? 'div'
    this.#selfCloseTag = selfCloseTags.includes(this.tag)
  }
  #setId() {
    this.id = this.id ? ` id="${this.id}"` : ''
  }
  #setClasses() {
    if (this.classes.length) {
      this.classes = ` class="` + this.classes.toString().replaceAll(',', ' ') + "\""
    }
    else {
      this.classes = ''
    }
  }
  #setAttributes(entryRule) {
    for (let decl of entryRule.declarations) {
      if (decl.type == 'comment') continue

      let declName = decl.property.split('-')

      if (validVariableNamesForAttributes.includes(declName[2])) {
        this.attributes += ' ' + this.#parseAttrVariable(decl)
      }
    }
  }
  #setText(entryRule) {
    this.text = entryRule.declarations.find(
      decl => decl.property == '--text'
    )?.value

    if (!this.text) return

    // Removing extra quotes
    this.textBefore = entryRule.declarations.find(
      decl => decl.property == '--text-before'
    )?.value
    this.textAfter = entryRule.declarations.find(
      decl => decl.property == '--text-after'
    )?.value

    // Removing extra quotes
    this.text = this?.text?.slice(1, -1)
    this.textBefore = this?.textBefore?.slice(1, -1)
    this.textAfter = this?.textAfter?.slice(1, -1)
  }
  #setTextFromComment(entryRule) {
    let commentWithText = entryRule.declarations.find(decl =>
      decl?.comment?.match(/{{.*}}/s)[0]
    )?.comment

    if (!commentWithText) return

    // Removing spaces necessary for readability of a comment
    commentWithText = commentWithText.slice(1, -1)

    let text = [
      // Get everything up to {{
      commentWithText.match(/^.*(?={{)/s)?.at(0),
      // Get everything in {{ }}
      commentWithText.match(/(?<={{).*?(?=}}|$)/s)?.at(0),
      // Get everything after }}
      commentWithText.match(/(?<=}}).*$/s)?.at(0)
    ]

    for (let i = 0; i < text.length; i++) {
      if (!text[i]?.trim()) {
        text[i] = ''
      }
    }

    [this.textBefore, this.text, this.textAfter] = text
  }
  #setParentAndSelfSelector(fullSelector) {
    let partsOfSelector = fullSelector.split(' ')

    if (partsOfSelector.length > 1) {
      this.parentSelector = partsOfSelector
        .filter((el, index) => index != partsOfSelector.length - 1)
        .join(' ')
    }

    this.selfSelector = partsOfSelector.at(-1)
  }

  #parseSelector(selector) {
    let lastNestedSelector = selector.split(' ').at(-1)
    let rule = selectorParser(lastNestedSelector)

    for (let item of rule.rules[0].items) {
      switch (item.type) {
        case 'TagName':
          this.tag = item.name
          break
        case 'ClassName':
          this.classes.push(item.name)
          break
        case 'Attribute':
          let value = item.value
            ? item?.operator + `"${item?.value?.value}"`
            : ''
          this.attributes += ' ' + item.name + value
          break
        case 'Id':
          this.id = item.name
          break
      }
    }
  }
  #parseAttrVariable(declaration) {
    let [type, name, value] = this.#getDeclarationData(declaration)

    switch (type) {
      case 'attr':
      case 'data':
        if (!value) { return name }

        return name + `="${value}"`

      case 'attrs':
        return value
    }
  }

  #isFirstLevelChild(element) {
    return element.fullSelector == `${this.fullSelector} ${element.selfSelector}`
  }
  #isInnerElement(element) {
    return element.parentSelector.startsWith(this.fullSelector)
  }
  #getDeclarationData(declaration) {
    let type = declaration.property.split('-')[2],
      name, value

    if (declaration.property.includes('--attr')) {
      name = declaration.property.replace('--attr-', '')
    }
    else if (declaration.property.includes('--data')) {
      name = declaration.property.replace('--', '')
    }

    if (/(")|(')|(`)/.test(declaration.value[0])) {
      // Removing nested quotes
      value = declaration.value.slice(1, -1)
    } else {
      value = declaration.value
    }

    return [type, name, value]
  }
}