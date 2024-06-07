import * as Plot from "@observablehq/plot";
import { createElement as h } from "react";

// DIRECTLY COPIED FROM https://codesandbox.io/p/sandbox/plot-react-f1jetw?file=%2Fsrc%2FPlotFigure.js%3A124%2C2
// For client-side rendering, see https://codesandbox.io/s/plot-react-csr-p4cr7t?file=/src/PlotFigure.jsx
// Based on https://github.com/observablehq/plot/blob/main/docs/components/PlotRender.js

export default function PlotFigure({ options }) {
  return Plot.plot({ ...options, document: new Document() }).toHyperScript();
}

// What is a Virtual DOM? 
// A real DOM is the actual representation of the web page. Any changes must be rerendered immediately, which is expensive
// the Virtual DOM is a lightweight, in memory representation of the DOM. When changes are made to the Virtual DOM, the changes
// to the read DOM can be compared and optimized to improve performance. 

// document is used to internally generate the plot
// represents a virtual Document Object Model (DOM)
class Document {
  constructor() {
    this.documentElement = new Element(this, "html");
  }
  // common elements in DOM APIs
  // simulates elements needed by observable for rendering
  createElementNS(namespace, tagName) {
    return new Element(this, tagName);
  }
  createElement(tagName) {
    return new Element(this, tagName);
  }
  createTextNode(value) {
    return new TextNode(this, value);
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
}

// Vritual CSS element
class Style {
  static empty = new Style();
  setProperty() {}
  removeProperty() {}
}

// virtual DOM element, mimics elements of such
// implements toHyperScript method -- converts virtual DOM to React element
class Element {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName;
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  setAttributeNS(namespace, name, value) {
    this.setAttribute(name, value);
  }
  getAttribute(name) {
    return this.attributes[name];
  }
  getAttributeNS(name) {
    return this.getAttribute(name);
  }
  hasAttribute(name) {
    return name in this.attributes;
  }
  hasAttributeNS(name) {
    return this.hasAttribute(name);
  }
  removeAttribute(name) {
    delete this.attributes[name];
  }
  removeAttributeNS(namespace, name) {
    this.removeAttribute(name);
  }
  addEventListener() {
    // ignored; interaction needs real DOM
  }
  removeEventListener() {
    // ignored; interaction needs real DOM
  }
  dispatchEvent() {
    // ignored; interaction needs real DOM
  }
  append(...children) {
    for (const child of children) {
      this.appendChild(
        child?.ownerDocument ? child : this.ownerDocument.createTextNode(child)
      );
    }
  }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  insertBefore(child, after) {
    if (after == null) {
      this.children.push(child);
    } else {
      const i = this.children.indexOf(after);
      if (i < 0) throw new Error("insertBefore reference node not found");
      this.children.splice(i, 0, child);
    }
    child.parentNode = this;
    return child;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  set textContent(value) {
    this.children = [this.ownerDocument.createTextNode(value)];
  }
  set style(value) {
    this.attributes.style = value;
  }
  get style() {
    return Style.empty;
  }
  toHyperScript() {
    return h(
      this.tagName,
      this.attributes,
      this.children.map((c) => c.toHyperScript())
    );
  }
}

// Virtual text node
class TextNode {
  constructor(ownerDocument, nodeValue) {
    this.ownerDocument = ownerDocument;
    this.nodeValue = String(nodeValue);
  }
  toHyperScript() {
    return this.nodeValue;
  }
}
