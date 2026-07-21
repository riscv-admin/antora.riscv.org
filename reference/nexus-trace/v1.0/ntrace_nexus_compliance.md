# 11.1. IEEE-5001 Nexus Standard Compliance

## [](#11-1-ieee-5001-nexus-standard-compliance)11.1\. IEEE-5001 Nexus Standard Compliance

The IEEE-5001 Nexus Standard provides a lot of flexibility and in general N-Trace can be considered fully compatible. There is one incompatible, small change:

* Field [ECODE](#field%5FECODE) is variable-length field (to assure TSTAMP field is on byte boundary).

Several compatible extensions are described in preceding chapters and are marked with **Extension:** marker. Each of them is disabled by default and must be directly enabled.
