# 4.1. SBI Requirements

## [](#sbi)4.1\. SBI Requirements

The _RISC-V Supervisor Binary Interface Specification_ (SBI) \[[8](bibliography.html#bib-sbi)\] defines an interface between the supervisor mode and the next higher privilege mode. This section defines the mandatory SBI version and extensions implemented by the higher privilege mode in order to be compatible with this specification.

| ID#                                                                                                      | Rule                                                                             |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| SBI\_010                                                                                                 | The SBI implementation MUST conform to SBI v2.0 or later.                        |
| SBI\_020                                                                                                 | The SBI implementation MUST implement the Hart State Management (HSM) extension. |
| _HSM is used by an OS for starting up, stopping, suspending and querying the status of secondary harts._ |                                                                                  |

Certain requirements are conditional on the presence of RISC-V ISA extensions or system features.

| ID#      | Rule                                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SBI\_030 | The Timer Extension (TIME) MUST be implemented, if the RISC-V "stimecmp / vstimecmp" Extension (Sstc, \[[11](bibliography.html#bib-sstc)\]) is not available.                                                                                    |
| SBI\_040 | The S-Mode IPI Extension (sPI) MUST be implemented, if the Incoming MSI Controller (IMSIC, \[[12](bibliography.html#bib-aia)\]) is not available.                                                                                                |
| SBI\_050 | The RFENCE Extension (RFNC) extension MUST be implemented, if the Incoming MSI Controller (IMSIC, \[[12](bibliography.html#bib-aia)\]) is not available.                                                                                         |
| SBI\_060 | The Performance Monitoring Extension (PMU) MUST be implemented, if the counter delegation-related S-Mode ISA extensions (Sscsrind \[[13](bibliography.html#bib-sscsrind)\] and Ssccfg \[[14](bibliography.html#bib-smcdeleg)\]) are not present. |
| SBI\_070 | The Debug Console Extension (DBCN) MUST be implemented if the ACPI SPCR table references Interface Type 0x15.                                                                                                                                    |
