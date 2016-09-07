window.ScopedStyle = window.ScopedStyle || (function(){
  "use strict";

  function escapeRegExp (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  var scopeClassRe = /\bscope-[a-z0-9]*-[0-9]*\b/;
  var scopeSelectorRe = /(?:^|\s|\n|\W)*-x-scope\b/;

  function createScope () {
    return 'scope-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  }

  function splitSelector(input){
    var result = [];
    var index = 0;
    var quote = false;
    for(var i = 0; i < input.length; i++){
      if(typeof result[index] === 'undefined'){
        result[index] = '';
      }
      if(input[i] === ',' && quote === false){
        index++;
      } else {
        if(['"', "'"].indexOf(input[i]) !== -1){
          if(quote === false){
            quote = input[i];
          } else if(quote === input[i]) {
            quote = false;
          }
        }
        result[index] += input[i];
      }
    }
    return result.map(Function.prototype.call.bind(String.prototype.trim));
  }

  function findChildren (node, selector) {
    var descendants = node.querySelectorAll(selector);
    return [].filter.call(descendants, function (descendant) {
      return (descendant.parentNode === node);
    });
  }

  // Remove all occurrences of "-x-scope" in a selector and add the scope as
  // a class selector before. When replacing -x-scope with the class selector,
  // add no space afterwards to make stuff like -x-scope[foo=bar] work
  function rewriteSelector (selector, scope) {
    return splitSelector(selector)
      .map(function(s){
        if(selector.match(scopeSelectorRe)){
          return '.' + scope + s.replace(scopeSelectorRe, '');
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

  function setScope (node, scope) {
    // Remove scope classes for which no child style node (identified by its
    // data-scope property) can be found. This is required to keep scopes unique
    // when cloning style elements while still supporting multiple scoped style
    // elements per parent node
    [].forEach.call(node.classList, function (className) {
      if(className.match(scopeClassRe)){
        var styleNodes = findChildren(node, '[data-scope="' + className + '"]');
        if(styleNodes.length === 0){
          node.classList.remove(className);
        }
      }
    });
    node.classList.add(scope);
  }

  return document.registerElement('scoped-style', {
    extends: 'style',
    prototype: Object.create(window.HTMLStyleElement.prototype, {
      attachedCallback: {
        value: function () {
          // Need to clear the stack just to be SURE that this works in
          // polyfilled environments. I was unable to reproduce the problem in
          // my tests, but in big projects the attachedCallback sometimes gets
          // called before there is a styleSheet object on the element instance.
          // Trust me on this :)
          var self = this;
          setTimeout(function(){
            var scope = createScope();
            self.setAttribute('data-scope', scope);
            rewriteRules(self.sheet, scope);
            setScope(self.parentNode, scope);
          }, 0);
        }
      },
      escapeRegExp: { value: escapeRegExp },
      createScope: { value: createScope },
      splitSelector: { value: splitSelector },
      findChildren: { value: findChildren },
      rewriteSelector: { value: rewriteSelector },
      rewriteRule: { value: rewriteRule },
      rewriteRules: { value: rewriteRules },
      setScope: { value: setScope }
    })
  });

})();