Scoped Style Sheets
===================

Scoped style sheets (style element that only apply to elements inside the same parent element) as a web component.

Usage:

```html
<script src="scoped-style.js"></script>
<div>
  <p>I'm red</p>
  <style type="text/css" is="scoped-style">
    p {
      color: red;
    }
  </style>
</div>
<p>I'm not red</p>
```

No dependencies. Works with @media rules. Half-heartedly tested in chrome and firefox. Could conceivably work in other browsers when web component polyfills are in place.