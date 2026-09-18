AONC.define('cssBuilder.motion', function (A) {
  'use strict';

  function build(ctx) {
    var perf = ctx.config.performance;
    var out = [];

    if (perf.reduceMotion) {
      out.push(
        '/* Reduce motion */\n' +
        '*, *::before, *::after {\n' +
        '  transition-duration: .01ms !important;\n' +
        '  animation-duration: .01ms !important;\n' +
        '  animation-iteration-count: 1 !important;\n' +
        '  scroll-behavior: auto !important;\n}'
      );
    }

    if (perf.killAnimations) {
      out.push(
        '/* Kill animations */\n' +
        '*, *::before, *::after {\n' +
        '  animation: none !important;\n' +
        '  transition: none !important;\n}\n' +
        '[class*="animate-"] {\n  animation: none !important;\n}\n' +
        '.aon-bg-animated {\n  animation: none !important;\n  background-image: none !important;\n}'
      );
    }

    if (perf.disableShadows) {
      out.push(
        '/* Disable shadows */\n' +
        '*, *::before, *::after {\n' +
        '  box-shadow: none !important;\n' +
        '  text-shadow: none !important;\n}\n' +
        '[class*="drop-shadow"] {\n  filter: none !important;\n}'
      );
    }

    if (perf.disableBlur) {
      out.push(
        '/* Disable blur */\n' +
        '*, *::before, *::after {\n' +
        '  backdrop-filter: none !important;\n' +
        '  -webkit-backdrop-filter: none !important;\n}\n' +
        '.aon-glass {\n  --aon-glass-filter: none !important;\n}\n' +
        '[class*="blur-"] {\n  filter: none !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build };
});
