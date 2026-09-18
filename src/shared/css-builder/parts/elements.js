AONC.define('cssBuilder.elements', function (A) {
  'use strict';

  var conv = A.color.convert;
  var units = A.css.units;
  var pattern = A.css.pattern;

  var STYLE_MAP = {
    dx: { prop: 'transform', unit: 'translateX' },
    dy: { prop: 'transform', unit: 'translateY' },
    opacity: { prop: 'opacity', unit: 'ratio' },
    blur: { prop: 'filter', unit: 'blur' },
    scale: { prop: 'transform', unit: 'scale' },
    background: { prop: 'background-color', unit: 'color' },
    color: { prop: 'color', unit: 'color' },
    fontSize: { prop: 'font-size', unit: 'px' },
    radius: { prop: 'border-radius', unit: 'px' },
    border: { prop: 'border', unit: 'raw' },
    zIndex: { prop: 'z-index', unit: 'int' },
    grayscale: { prop: 'filter', unit: 'grayscale' },
    brightness: { prop: 'filter', unit: 'brightness' },
    pointerEvents: { prop: 'pointer-events', unit: 'raw' },
    position: { prop: 'position', unit: 'raw' },
    margin: { prop: 'margin', unit: 'raw' },
    padding: { prop: 'padding', unit: 'raw' },
    width: { prop: 'width', unit: 'raw' },
    height: { prop: 'height', unit: 'raw' }
  };

  function formatValue(key, spec, value) {
    if (value == null || value === '') return null;
    switch (spec.unit) {
      case 'ratio': return String(A.lang.clamp(value, 0, 1));
      case 'blur': return 'blur(' + units.px(value) + ')';
      case 'translateX': return Number(value) === 0 ? null : 'translateX(' + units.px(value) + ')';
      case 'translateY': return Number(value) === 0 ? null : 'translateY(' + units.px(value) + ')';
      case 'scale': return Number(value) === 1 ? null : 'scale(' + units.ratioValue(value, 1) + ')';
      case 'grayscale': return 'grayscale(' + A.lang.clamp(value, 0, 100) + '%)';
      case 'brightness': return 'brightness(' + units.ratioValue(value, 1) + ')';
      case 'color': return conv.isValid(value) ? String(value) : null;
      case 'px': return units.px(value);
      case 'int': return units.int(value);
      default: return String(value);
    }
  }

  function declarationsFor(rule) {
    var props = {};
    var style = rule.style || {};

    Object.keys(STYLE_MAP).forEach(function (key) {
      var spec = STYLE_MAP[key];
      var value = formatValue(key, spec, style[key]);
      if (value == null) return;
      if (spec.prop === 'filter' || spec.prop === 'transform') {
        props[spec.prop] = (props[spec.prop] ? props[spec.prop] + ' ' : '') + value;
      } else {
        props[spec.prop] = value;
      }
    });

    if (props.transform) props['transform-origin'] = 'center';

    return props;
  }

  function hideDeclarations(rule) {
    var strategy = rule.hideStrategy || 'display';
    switch (strategy) {
      case 'visibility':
        return { visibility: 'hidden', 'pointer-events': 'none' };
      case 'opacity':
        return { opacity: '0', 'pointer-events': 'none' };
      case 'collapse':
        return { height: '0', overflow: 'hidden', margin: '0', padding: '0', border: '0', opacity: '0' };
      case 'offscreen':
        return {
          position: 'absolute', width: '1px', height: '1px',
          overflow: 'hidden', clip: 'rect(0 0 0 0)', 'white-space': 'nowrap'
        };
      default:
        return { display: 'none' };
    }
  }

  function buildRule(rule, url) {
    if (!rule || !rule.enabled) return '';
    if (rule.urlPatterns && rule.urlPatterns.length && !pattern.matchesAny(url, rule.urlPatterns)) return '';

    var selector = String(rule.selector || '').trim();
    if (!selector) return '';

    var decls = rule.action === 'style' ? declarationsFor(rule) : hideDeclarations(rule);
    var important = rule.important !== false ? ' !important' : '';

    var body = Object.keys(decls).map(function (k) {
      return '  ' + k + ': ' + decls[k] + important + ';';
    });

    var raw = String(rule.rawCss || '').trim();
    if (raw) body.push(A.css.writer.indent(raw));

    if (!body.length) return '';

    var name = rule.name ? ' [' + rule.name + ']' : '';
    return '/* element' + name + ' */\n' + selector + ' {\n' + body.join('\n') + '\n}';
  }

  function build(ctx) {
    var rules = (ctx.config.elements && ctx.config.elements.rules) || [];
    if (!rules.length) return '';

    var chunks = rules.map(function (r) { return buildRule(r, ctx.url); }).filter(Boolean);
    if (!chunks.length) return '';

    ctx.activeRuleCount = chunks.length;
    return '/* Element rules */\n' + chunks.join('\n\n');
  }

  return { build: build, buildRule: buildRule, STYLE_MAP: STYLE_MAP, declarationsFor: declarationsFor, hideDeclarations: hideDeclarations };
});
