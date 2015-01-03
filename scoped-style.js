(function(){
"use strict";

  function escapeRegExp (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  function createScope () {
    return 'scope-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  }

  // Remove all occurrences of ":scope" in al selector and add the scope as
  // a class selector before. When dealing with :scope, add no space afterwards
  // to make stuff like :scope[foo=bar] work
  function rewriteSelector (selector, scope) {
    var re = /^\s*:scope/;
    if(selector.match(re)){
      return '.' + scope + selector.replace(re, '');
    } else {
      return '.' + scope + ' ' + selector;
    }
  }

  // Remove and replace the rule's selector because there's no way to simply
  // get a string of all declarations
  function rewriteRule (rule, scope) {
    var re = new RegExp('^\\s*' + escapeRegExp(rule.selectorText));
    var css = rule.cssText.replace(re, '');
    var selector = rewriteSelector(rule.selectorText, scope);
    return selector + css;
  }

  function rewriteRules (source, scope) {
    var rules = source.rules || source.cssRules;
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
    return [].reduce.call(sheet.rules, function(css, rule){
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