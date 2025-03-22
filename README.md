[jdeploy](https://github.com/shannah/jdeploy) build of the [Alloy Language](https://github.com/AlloyTools/org.alloytools.alloy) jar for distribution via npm.

This installs a binary named `alloy-lang` (to differentiate it from other npm packages with similar names). This package doesn't include any javascript wrapper, maybe I'll do that later. In the meantime, you can call the binary.

Execute with the GUI by running `alloy-lang` on the command line. Run `alloy-lang help` for more options.

You can also run non-interactively, but you have to write to a temporary file (alloy won't read from stdin). You can also request `json` as the output format.

This distribution comes with a javascript wrapper for non-interactive Alloy evaluation with JSON output:

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
