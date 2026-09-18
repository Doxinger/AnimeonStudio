AONC.define('cssBuilder.chat', function (A) {
  'use strict';

  var conv = A.color.convert;

  var ROW = 'div[data-msg-id]';
  var COL = ROW + ' > div.w-10';
  var AVATAR = ROW + ' div[style*="width: 40px"]';
  var FRAME = ROW + ' div[style*="width: 58px"]';
  var CONTENT = ROW + ' > div.min-w-0';
  var HEAD = CONTENT + ' > div:first-child';
  var BUBBLE = CONTENT + ' div[class*="px-3"][class*="py-2"]';
  var TIME = HEAD + ' span[class*="font-mono"]';
  var LEVEL = COL + ' button[aria-label^="Уровень"]';
  var TITLE_BADGES = HEAD + ' span[class*="-host"], ' + HEAD + ' span[data-level]';
  var ACTIONS = ROW + ' > div.absolute';

  function build(ctx) {
    var c = ctx.config.chat;
    if (!c) return '';
    var out = [];
    var any = c.fontSize || c.spacing || c.avatarSize || c.maxWidth || c.radius >= 0 ||
      c.bubbles !== 'default' || c.altRows || c.hideLevels || c.hideBadges || c.hideTime ||
      c.hideActions || c.highlightOwn || c.mentionHighlight;
    if (!any) return '';

    out.push('/* Chat */');

    if (c.fontSize) {
      out.push(BUBBLE + ' {\n  font-size: ' + A.lang.clamp(c.fontSize, 10, 24) + 'px !important;\n}');
    }
    if (c.spacing) {
      var sp = A.lang.clamp(c.spacing, 0, 24);
      out.push(ROW + ' {\n  margin-top: ' + sp + 'px !important;\n  padding-top: ' + (sp / 4).toFixed(1) + 'px !important;\n  padding-bottom: ' + (sp / 4).toFixed(1) + 'px !important;\n}');
    }
    if (c.avatarSize) {
      var av = A.lang.clamp(c.avatarSize, 24, 72);
      out.push(
        COL + ' {\n  width: ' + av + 'px !important;\n}\n' +
        AVATAR + ', ' + AVATAR + ' > span {\n  width: ' + av + 'px !important;\n  height: ' + av + 'px !important;\n}\n' +
        FRAME + ' {\n  width: ' + Math.round(av * 1.45) + 'px !important;\n  height: ' + Math.round(av * 1.45) + 'px !important;\n}'
      );
    }
    if (c.maxWidth) {
      out.push(CONTENT + ' {\n  max-width: ' + A.lang.clamp(c.maxWidth, 240, 1200) + 'px !important;\n}');
    }
    if (c.radius >= 0) {
      out.push(BUBBLE + ' {\n  border-radius: ' + A.lang.clamp(c.radius, 0, 24) + 'px !important;\n}');
    }

    if (c.bubbles === 'solid') {
      out.push(BUBBLE + ' {\n  background-color: rgba(255,255,255,0.10) !important;\n  border: 0 !important;\n}');
    } else if (c.bubbles === 'outline') {
      out.push(BUBBLE + ' {\n  background-color: transparent !important;\n  border: 1px solid var(--aonc-border, rgba(255,255,255,0.1)) !important;\n}');
    } else if (c.bubbles === 'none') {
      out.push(BUBBLE + ' {\n  background-color: transparent !important;\n  border: 0 !important;\n  padding-left: 0 !important;\n  padding-right: 0 !important;\n}');
    }

    if (c.altRows) {
      out.push(ROW + ':nth-child(even) {\n  background-color: rgba(255,255,255,0.03) !important;\n}');
    }
    if (c.hideLevels) out.push(LEVEL + ' {\n  display: none !important;\n}');
    if (c.hideBadges) out.push(TITLE_BADGES + ' {\n  display: none !important;\n}');
    if (c.hideTime) out.push(TIME + ' {\n  display: none !important;\n}');
    if (c.hideActions) out.push(ACTIONS + ' {\n  display: none !important;\n}');

    if (c.highlightOwn) {
      var own = conv.rgba(conv.sanitize(c.ownColor, '#7C4DFF'), 0.09);
      var edge = conv.sanitize(c.ownColor, '#7C4DFF');
      out.push(
        ROW + '.aonc-own {\n  background-color: ' + own + ' !important;\n' +
        '  box-shadow: inset 3px 0 0 ' + edge + ' !important;\n}'
      );
    }
    if (c.mentionHighlight) {
      out.push(
        ROW + '.aonc-mention {\n  background-color: rgba(255,184,77,0.10) !important;\n' +
        '  box-shadow: inset 3px 0 0 #ffb84d !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build, ROW: ROW, BUBBLE: BUBBLE };
});
