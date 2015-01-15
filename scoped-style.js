(function(){
"use strict";

  function escapeRegExp (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  function createScope () {
    return 'scope-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  }

  // Remove all occurrences of "-x-scope" in a selector and add the scope as
  // a class selector before. When replacing -x-scope with the class selector,
  // add no space afterwards to make stuff like -x-scope[foo=bar] work
  function rewriteSelector (selector, scope) {
    var reSelector = /(?:^|\s|\n|\W)*-x-scope\b/;
    return selector.split(',')
      .map(function(s){
        if(selector.match(reSelector)){
          return '.' + scope + s.replace(reSelector, '');
        } else {
          return '.' + scope + ' ' + s;
        }
      })
      .join(',');
  }

  // Remove and replace the rule's selector because there's no other way to only
  // get a string of all declarations
  function rewriteRule (rule, scope) {
    var reSelector = new RegExp('^\\s*' + escapeRegExp(rule.selectorText));
    var css = rule.cssText.replace(reSelector, '');
    var selector = rewriteSelector(rule.selectorText, scope);
    return selector + css;
  }

  function rewriteRules (source, scope) {
    var rules = source.cssRules;
    for (var i = 0; i < rules.length; i++) {
      switch (rules[i].type) {
        case 1: // StyleRule
          var newCssText = rewriteRule(rules[i], scope);
          source.deleteRule(i);
          source.insertRule(newCssText, i);
          break;
        case 4: // MediaRule
          rewriteRules(rules[i], scope);
          break;
        default: // Don't touch other rules
          break;
      }
    }
  }

  function sheetToCss(sheet){
    return [].reduce.call(sheet.cssRules, function(css, rule){
      return css + rule.cssText;
    }, '');
  }

  var proto = {
    createdCallback: function () {
      var scope = createScope();
      rewriteRules(this.sheet, scope);
      this.innerHTML = sheetToCss(this.sheet); // Keeps styles when cloned
      this.parentNode.classList.add(scope);
    }
  };

  Object.setPrototypeOf(proto, window.HTMLStyleElement.prototype);

  document.registerElement('scoped-style', {
    extends: 'style',
    prototype: proto
  });

})();