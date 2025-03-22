[jdeploy](https://github.com/shannah/jdeploy) build of the [Alloy Language](https://github.com/AlloyTools/org.alloytools.alloy) jar for distribution via npm.

This installs a binary named `alloy-lang` (to differentiate it from other npm packages with similar names). This package doesn't include any javascript wrapper, maybe I'll do that later. In the meantime, you can call the binary.

Execute with the GUI:
```sh
alloy-lang
```

You can also run non-interactively, but you have to write to a temporary file (alloy won't read from stdin). You can also request `json` as the output format.

```sh
TEMPFILE=$(mktemp)
echo 'sig Thing {} run { one Thing }' > $TEMPFILE
alloy-lang exec -o - -t json $TEMPFILE
rm $TEMPFILE
```

This will output something like:

```json
{
  "duration": 26,
  "incremental": true,
  "instances": [
    {
      "messages": [],
      "skolems": {},
      "state": 0,
      "values": {
        "0": {},
        "1": {},
        "2": {},
        "3": {},
        "Thing$2": {}
      }
    }
  ],
  "localtime": "2025-03-21T21:22:13.357550566",
  "loopstate": -1,
  "sigs": {},
  "timezone": "America/New_York",
  "utctime": 1742606533357
}
```

Which is to say, running this model produced one instance with three instantiated values -- the integers 0..3 and a single `Thing`.
