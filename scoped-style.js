(function(){
"use strict";

  function createScope () {
    return 'scope-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  }

  function rewriteRule (rule, scope) {
    var ruleCssText = rule.cssText.replace(/^\s*:scope/, ''); // :scope selector
    return '.' + scope + ' ' + ruleCssText;
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
      this.innerHTML = sheetToCss(this.sheet);
      this.parentNode.classList.add(scope);
    }
  };

  Object.setPrototypeOf(proto, window.HTMLStyleElement.prototype);


  document.registerElement('scoped-style', {
    extends: 'style',
    prototype: proto
  });

})();