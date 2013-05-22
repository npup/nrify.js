/**
*
* Name: nrify.js
* Version: 0.1
* Description: simple mimic of input[type=number]
* Author: P. Envall (petter.envall@gmail.com, @npup)
* Date: 2013-05-09
*
*
* API:
*   nrify(form);
*     form     - (form element) form to scan for input[type=number] elements to activate
*/
var nrify = (function () {

  var win = this, doc = win.document
    , supportsNumber = (function () {
    var input = doc.createElement("input");
    input.setAttribute("type", "number");
    return input.type != "text";
  })();

  function activate(input) {
    input.setAttribute("data-nrify-activated", "true");
    buildUI(input);
  }
  function buildUI(input) {
    var container = createElem("span", "nrify-arrows", {
      "position": "relative"
      , "display": "inline-block"
      , "width": "1em"
      , "left": "-1.3em"
      , "fontSize": ".5em"
      , "height": "3em"
      , "verticalAlign": "middle"
      , "cursor": "pointer"
    });
    container.appendChild(createElem("span", "nrify-up", {
        "position": "absolute"
        , "left": "0"
        , "top": ".3em"
      }, "&#x25b2;")
    );
    container.appendChild(createElem("span", "nrify-down", {
        "position": "absolute"
        , "left": "0"
        , "bottom": ".3em"
      }, "&#x25bc;")
    );
    input.parentNode.insertBefore(container, input);
    input.parentNode.insertBefore(input, container);
  }

  function createElem(tag, className, styles, html) {
    var elem = doc.createElement(tag);
    elem.className = className;
    "string" == typeof html && (elem.innerHTML = html);
    for (var prop in styles) {
      elem.style[prop] = styles[prop];
    }
    return elem;
  }

  function isActivated(nrified) {
    return nrified && nrified.getAttribute("data-nrify-activated")=="true";
  }

  function processCmd(dir, input) {
    var curVal = getNumber(input.value, 0)
      , step = getStep(input)
      , newVal = curVal + dir*step
      , diff = getNumber(input.value, 0) % step;
    diff!=0 &&  (newVal += dir>0 ? -dir*diff : step-diff);
    var min = getNumber(input.getAttribute("min"), Number.MIN_VALUE)
      , max = getNumber(input.getAttribute("max"), Number.MAX_VALUE);
    newVal = Math.min(Math.max(min, newVal), max);
    if (!isInt(newVal)) {
      var precision = Math.min(
        getPrecision(input.getAttribute("step"))
        , getPrecision(String(newVal))
      );
      newVal = newVal.toFixed(precision);
    }
    input.value = newVal;
  }

  function getStep(input) {
    var step = getNumber(input.getAttribute("step"), null);
    return step===null || step<=0 ? 1 : step; // disallow step <= 0
  }

  // number utils
  function isInt(str) {return !!isInt.expr.exec(str);}
  isInt.expr = /^\s*-?(\d+)\s*$/; // does not handle exponents etc
  function getPrecision(stepStr, defaultValue) {
    if (!stepStr) {return defaultValue || 0;}
    var match = getPrecision.expr.exec(stepStr);
    if (!match) {return defaultValue || 0;}
    return match[1].length;
  }
  getPrecision.expr = /^\s*-?(?:\d+)?\.?(\d+)s*$/;
  function getNumber(str, defaultValue) {
    var result = arguments.length<2 ? getNumber.defaultValue : defaultValue
      , match;
    if (str && (match = getNumber.expr.exec(str))) {
      result = parseFloat(match[1], 10);
    }
    return result;
  }
  getNumber.defaultValue = 0;
  getNumber.expr = /^\s*(-?(?:\d+)?\.?\d+)\s*$/;

  // quick and lazy AEL/AE abstraction
  var Event = (function () {
    var listen = function (elem, event, handler) {
      if ("addEventListener" in doc) {
        listen = function (elem, event, handler) {elem.addEventListener(event, handler, false);};
      }
      else if ("attachEvent" in doc) {listen = function () {elem.attachEvent("on"+event, handler);};}
      listen(elem, event, handler);
    }
    , prevent = function (e) {
      if ("function" == typeof e.preventDefault) {prevent = function (e) {e.preventDefault();};}
      else {prevent = function (e) {e.returnValue = false;};}
      prevent(e);
    }
    , getTarget = function (e) {
      if (e.target) {getTarget = function (e) {return e.target;};}
      else if (e.srcElement) {getTarget = function (e) {return e.srcElement;};}
      else {getTarget = function () {throw new Error("event has no target or srcElement");};}
      return getTarget(e);
    };
    return {
      "listen": listen
      , "prevent": prevent
      , "getTarget": getTarget
    };
  })();

  // user interaction
  (function () {
    var cmds = {
      // from widget elements classes
      "up": 1
      , "down": -1
      // from keyCodes
      , "38": 1
      , "40": -1
    };
    // keyboard
    Event.listen(doc, "keydown", function (e) {
      var target = Event.getTarget(e)
        , cmd = cmds[e.keyCode];
      if (!(cmd && isActivated(target))) {return;}
      Event.prevent(e);
      processCmd(cmd, target);
    });
    // mouse
    var state = {};
    Event.listen(doc, "mouseup", function () {state = {};});
    Event.listen(doc, "mousedown", function (e) {
      var target = Event.getTarget(e)
        , dir = target.className.replace(/^nrify-/, "")
        , cmd = cmds[dir]
        , input = target.parentNode && target.parentNode.previousSibling;
      if (!(cmd && isActivated(input))) {return;}
      state = {
        "mousedown": true
        , "cmd": cmd
        , "input": input
      };
      tick(750);
    });
    function tick(customInterval) {
      if (state.mousedown) {
        processCmd(state.cmd, state.input);
        setTimeout(tick, "number"==typeof customInterval ? customInterval : tick.interval);
      }
    }
    tick.interval = 100;
  })();

  return supportsNumber ? function () {
    // using native input[type=number]
  } : function (form) {
    var elements = form.elements, elem;
    for (var idx=0, len=elements.length; idx<len; ++idx) {
      elem = elements[idx];
      elem.getAttribute("type")=="number" && activate(elem);
    }
  };

})();
