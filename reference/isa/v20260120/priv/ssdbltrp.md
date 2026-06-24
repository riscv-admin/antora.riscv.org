# 17.1. "Ssdbltrp" Double Trap Extension, Version 1.0

## [](#ssdbltrp)17.1\. "Ssdbltrp" Double Trap Extension, Version 1.0

The Ssdbltrp extension addresses a double trap (See [Double Trap Control in mstatus Register](machine.html#machine-double-trap)) privilege modes lower than M. It enables HS-mode to invoke a critical error handler in a virtual machine on a double trap in VS-mode. It also allows M-mode to invoke a critical error handler in the OS/Hypervisor on a double trap in S/HS-mode.

The Ssdbltrp extension adds the `menvcfg`.DTE (See [Machine Environment Configuration (menvcfg) Register](machine.html#sec:menvcfg)) and the`sstatus`.SDT fields (See [Supervisor Status (sstatus) Register](supervisor.html#sstatus)). If the hypervisor extension is additionally implemented, then the extension adds the `henvcfg`.DTE (See[Hypervisor Environment Configuration Register (henvcfg)](hypervisor.html#sec:henvcfg)) and the `vsstatus`.SDT fields (See [Virtual Supervisor Status (vsstatus) Register](hypervisor.html#vsstatus)).

See [Double Trap Control in sstatus Register](supervisor.html#supv-double-trap) for the operational details.
