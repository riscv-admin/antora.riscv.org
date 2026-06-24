# 10.1. "Smdbltrp" Double Trap Extension, Version 1.0

## [](#smdbltrp)10.1\. "Smdbltrp" Double Trap Extension, Version 1.0

The Smdbltrp extension addresses a double trap (See [Double Trap Control in mstatus Register](machine.html#machine-double-trap)) in M-mode. When the Smrnmi extension (["Smrnmi" Extension for Resumable Non-Maskable Interrupts](rnmi.html#rnmi)) is implemented, it enables invocation of the RNMI handler on a double trap in M-mode to handle the critical error. If the Smrnmi extension is not implemented or if a double trap occurs during the RNMI handler’s execution, this extension helps transition the hart to a critical error state and enables signaling the critical error to the platform.

To improve error diagnosis and resolution, this extension supports debugging harts in a critical error state. The extension introduces a mechanism to enter Debug Mode instead of asserting a critical-error signal to the platform when the hart is in a critical error state. See \[[91](../biblio/bibliography.html#bib-debug%5Fspec)\] for details.

See [Double Trap Control in mstatus Register](machine.html#machine-double-trap) for the operational details.
