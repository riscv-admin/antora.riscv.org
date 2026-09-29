# 2.1. Hart to Trace Encoder interface extensions

## [](#sec:extensions)2.1\. Hart to Trace Encoder interface extensions

This chapter specifies the following standard extensions to the base Hart to Trace Interface.

| |  This document is [Ratified](http://riscv.org/spec-state). No changes are allowed. Any desired or needed changes can be the subject of a follow-on new extension. Ratified extensions are never revised. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#sec:trcstate)2.1.1\. Trace State

The **halted** signal defined in [Optional sideband encoder input signals](#tab:ingress-side-band) provides a mechanism to inhibit tracing whilst the hart is in Debug mode. However, since this was defined, other conditions that require similar behaviour have been identified:

* Inhibiting trace for security reasons;
* Pausing trace for an unbounded amount of time.

To accomplish this, the **halted** signal is replaced with the multi-bit **trcstate** signal defined below:

__Table 1\. Optional sideband encoder input signal for trace state__
| **Signal**          | **Group** | **Function**                                                                                                                                 |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **trcstate\[1:0\]** | O         | 00: Tracing uninhibited by the hart01: Inhibit trace as the hart is in debug mode.10: Inhibit trace for security reasons.11: Unbounded wait. |

When set to any non-zero value, the encoder will output a packet containing the information the decoder requires in order to determine the final instruction retired up to this point (e.g. the address of that instruction, or the instruction count since the last reported instruction). If trace is inhibited (but not paused), the encoder will then also indicate that tracing has stopped.

Upon return to zero, the encoder may start tracing again (subject to any other filtering), commencing with a synchronization packet.

If there are simultaneously multiple different reasons for the hart to drive a non-zero value, it should prioritize the lowest numerical value.

**Note:** If neither **halted** nor **trcstate** are provided, it is strongly recommended that Debug mode can be signalled via the **priv** signal. This will allow tracing in Debug mode to be controlled via the optional filtering capabilities.

#### [](#sec:sdsec)2.1.1.1\. External Debug Security (sdsec)

The External Debug Security specification introduces the concept of the logical 'sec\_inhibit' signal, which when active requires trace to be inhibited. This can be achieved by setting **trcstate** to 10 when 'sec\_inhibit' is true.

#### [](#sec:wfi)2.1.1.2\. Unbounded Wait

Several instructions can cause the hart to wait for some condition before retiring. These can be further classified as bounded or unbounded:

* _bounded wait_ instructions such as PAUSE or Wait on Reservation Set with short time-out (WRS.STO), where there is a maximum wait time;
* _unbounded wait_ instructions such as Wait for Interrupt (WFI) or Wait on Reservation Set with no time-out (WRS.NTO), where there is no upper limit on the duration of the wait time.

An unbounded wait can result in a long pause in activity, and in some cases (possibly as the result of a software bug), the pause may be indefinite.

Providing a mechanism for the trace encoder to indicate that an unbounded wait has been entered allows the user to be informed of this, and if timestamps are enabled gives an indication of the time of entry. Combined with a timestamped sync packet following exit from the wait, this allows the user to determine how long the hart spent in the wait state.

Without this mechanism, unbounded wait instructions have no direct impact on the trace stream (they are treated as ordinary instructions with **itype** \= 0 when they retire). If an indefinite wait occurs, the trace message stream simply stops without any indication as to why.

Unbounded wait instructions may also disable the hart clock, and by extension the clock used by the trace encoder. For encoders that utilize partial timestamps, any accrued branch history must be reported within a maximum time from the last packet in order to maintain timestamp integrity, and this cannot be done if the clock is stopped. Outputting any such history when **trcstate** becomes 11 prior to disabling the clock avoids this potential issue.

#### [](#2-1-1-3-backwards-compatibility-considerations)2.1.1.3\. Backwards compatibility considerations

* A hart which supports **halted** can be connected to a Trace Encoder that supports **trcstate** by wiring **halted** to **trcstate\[0\]**, and tying **trcstate\[1\]** to 0.
* A hart which supports **trcstate** can be connected to a Trace Encoder that supports **halted** by connecting the OR of both bits of the hart’s **trcstate** output to the encoder’s **halted** input.
