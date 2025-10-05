[jdeploy](https://github.com/shannah/jdeploy) build of the [Alloy Language](https://github.com/AlloyTools/org.alloytools.alloy) jar for distribution via npm.

This installs a binary named `alloy-lang` (to differentiate it from other npm packages with similar names).

Execute with the GUI by running `alloy-lang` on the command line. Run `alloy-lang help` for more options.

## JavaScript Wrapper

This distribution includes a JavaScript wrapper for non-interactive Alloy evaluation with JSON output. The wrapper automatically resolves the binary path, so it works without requiring `alloy-lang` to be in your PATH:

```javascript
import alloy from 'alloy-lang';

const result = alloy.eval('sig Thing {} run { one Thing }');
console.dir(result, { depth: null });
```

which outputs:

```json
{
  duration: 84,
  incremental: true,
  instances: [
    {
      messages: [],
      skolems: {},
      state: 0,
      values: { '0': {}, '1': {}, '2': {}, '3': {}, 'Thing$2': {} }
    }
  ],
  localtime: '2025-03-22T14:36:25.496787586',
  loopstate: -1,
  sigs: {},
  timezone: 'America/New_York',
  utctime: 1742668585496
}
```

Which is to say that the Alloy program returns one instance with a few integers and a single `Thing` defined to satisfy the run. Fun!
