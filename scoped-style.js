(function(){
"use strict";

var proto = (function(){

  function createScope () {
    return 'scope-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  }

  function rewriteRules (source, scope) {
    var rules = source.rules || source.cssRules;
    for(var i = 0; i < rules.length; i++){
      switch(rules[i].type){
        case 1: // StyleRule
          var cssText = rules[i].cssText;
          source.deleteRule(i);
          source.insertRule('.' + scope + ' ' + cssText, i);
          break;
        case 4: // MediaRule
          rewriteRules(rules[i], scope);
          break;
        default: // Don't touch other rules
          break;
      }
    }
  }

  var proto = {
    createdCallback: function () {
      var scope = createScope();
      var rules = rewriteRules(this.sheet, scope);
      this.parentNode.classList.add(scope);
    }
  };

  Object.setPrototypeOf(proto, window.HTMLStyleElement.prototype);

  return proto;

})();

document.registerElement('scoped-style', {
  extends: 'style',
  prototype: proto
});

})();