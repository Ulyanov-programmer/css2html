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
    this.#string += this.textBefore ? ` ${this.textBefore}` : ''
  }
  #addTextAfter() {
    this.#string += this.textAfter ? `${this.textAfter}` : ''
  }
  #addText() {
    this.#string += this.text ? `${this.text}` : ''
  }
  #addInnerElements() {
    for (let innerElement of this.innerElements) {
      this.#string += '\n' + innerElement.string
    }
  }
  #createEndString() {
    if (!this.#selfCloseTag) {
      this.#string += '</' + this.tag + '>'
    }
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
    this.textBefore = entryRule.declarations.find(
      decl => decl.property == '--text-before'
    )?.value
    this.textAfter = entryRule.declarations.find(
      decl => decl.property == '--text-after'
    )?.value

    // Removing extra quotes
    this.text = this?.text?.substring(1, this.text.length - 1)
    this.textBefore = this?.textBefore?.substring(1, this.textBefore.length - 1)
    this.textAfter = this?.textAfter?.substring(1, this.textAfter.length - 1)
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
    let declName = declaration.property.split('-')[2]
    let name, values

    switch (declName) {
      case 'attr':
      case 'data':
        // Deleting the "--attr-" in a variable
        name = declaration.property.replace('--', '').replace('attr-', '')
        values = declaration.value ? '=' + declaration.value : ''
        return name + values

      case 'attrs':
        values = declaration.value.substring(1, declaration.value.length - 1)

        return values
    }
  }

  #isFirstLevelChild(element) {
    return element.fullSelector == `${this.fullSelector} ${element.selfSelector}`
  }
  #isInnerElement(element) {
    return element.parentSelector.startsWith(this.fullSelector)
  }
}