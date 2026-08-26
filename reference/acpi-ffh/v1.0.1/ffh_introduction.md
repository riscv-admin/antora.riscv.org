# 1.1. Introduction

## [](#1-1-introduction)1.1\. Introduction

RISC-V systems which use Advanced Configuration and Power Interface (ACPI) require additional specifications for some ACPI object fields, typically those of type “Resource Descriptor”. A Functional Fixed Hardware (FFH) specification provides those additional specifications. The use cases addressed by this FFH are as follows:

* Lower Power Idle States (LPI), \[ACPI 6.5\] section 8.4.3
* Collaborative Processor Performance Control (CPPC), \[ACPI 6.5\] section 8.4.6

### [](#1-1-1-terms-and-abbreviations)1.1.1\. Terms and Abbreviations

This specification uses the following terms and abbreviations:

| Term | Meaning                                                      |
| ---- | ------------------------------------------------------------ |
| ACPI | Advanced Configuration and Power Interface Specification     |
| ASL  | ACPI Source Language                                         |
| CPC  | Continuous Performance Control                               |
| CPPC | Collaborative Processor Performance Control                  |
| FFH  | Functional Fixed Hardware                                    |
| HSM  | Hart State Management                                        |
| LPI  | Low Power Idle                                               |
| OSPM | Operating System-directed configuration and Power Management |
| SBI  | Supervisor Binary Interface                                  |

### [](#1-1-2-references)1.1.2\. References

| Reference    | Description                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| \[ACPI 6.5\] | Advanced Configuration and Power Interface Specification version 6.5 <https://uefi.org/specs/ACPI/6.5/>        |
| \[SBI\]      | RISC-V Supervisor Binary Interface Specification version 2.0 <https://github.com/riscv-non-isa/riscv-sbi-doc/> |
