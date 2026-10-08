# Abandoned Empire

Infocom's Zork, ported to the [Stage engine](https://engine.sgail.com) - published under the name _Abandoned Empire_, See [NOTICE.md](NOTICE.md#the-name).

This is a port and not a remake: where there is text, it's what Infocom wrote. [NOTICE.md](NOTICE.md) explains where the source came from and under what terms. Zork I is `abandoned-empire-1/`; Zork II and III use the same ZIL and the same tooling, and will eventually sit beside as `abandoned-empire-2/` and `abandoned-empire-3/`when I get the chance to port them over and test them thoroughly. 

## Playing it

```sh
stage compile abandoned-empire-1
stage abandoned-empire-1.stg --gui
```
