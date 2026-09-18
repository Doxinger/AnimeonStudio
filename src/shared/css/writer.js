AONC.define('css.writer', function () {
  'use strict';

  function Writer() {
    this.parts = [];
  }

  Writer.prototype.section = function (title) {
    this.parts.push('\n/* ' + title + ' */');
    return this;
  };

  Writer.prototype.raw = function (text) {
    if (text) this.parts.push(String(text));
    return this;
  };

  Writer.prototype.decl = function (prop, value) {
    if (value == null || value === '' || value === false) return this;
    this.parts.push('  ' + prop + ': ' + value + ';');
    return this;
  };

  Writer.prototype.declImportant = function (prop, value) {
    if (value == null || value === '' || value === false) return this;
    this.parts.push('  ' + prop + ': ' + value + ' !important;');
    return this;
  };

  Writer.prototype.decls = function (map, important) {
    var self = this;
    Object.keys(map || {}).forEach(function (k) {
      if (important) self.declImportant(k, map[k]);
      else self.decl(k, map[k]);
    });
    return this;
  };

  Writer.prototype.rule = function (selector, body) {
    if (!selector || !body) return this;
    this.parts.push(selector + ' {');
    this.parts.push(body);
    this.parts.push('}');
    return this;
  };

  Writer.prototype.begin = function (selector) {
    this.parts.push(selector + ' {');
    return this;
  };

  Writer.prototype.end = function () {
    this.parts.push('}');
    return this;
  };

  Writer.prototype.at = function (query, inner) {
    if (!query || !inner) return this;
    this.parts.push(query + ' {');
    this.parts.push(inner);
    this.parts.push('}');
    return this;
  };

  Writer.prototype.toString = function () {
    return this.parts.join('\n');
  };

  Writer.prototype.isEmpty = function () {
    return this.parts.every(function (p) { return !p || /^[\s\n]*(\/\*[^]*\*\/)?[\s\n]*$/.test(p); });
  };

  function indent(text) {
    return String(text).split('\n').map(function (l) { return l ? '  ' + l : l; }).join('\n');
  }

  return { Writer: Writer, indent: indent };
});
