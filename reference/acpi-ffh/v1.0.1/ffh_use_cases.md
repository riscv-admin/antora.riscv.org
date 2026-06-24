# 3.1. Use Cases

## [](#3-1-use-cases)3.1\. Use Cases

### [](#3-1-1-lower-power-idle-states)3.1.1\. Lower Power Idle States

It is desirable for RISC-V system harts to transition to lower power states when they go idle. ACPI provides Lower Power Idle State (\_LPI) objects which support an operating system’s implementation of transitioning to lower power states. The following subsections specify some fields of the \_LPI object for RISC-V systems. Refer to the ACPI specification for all remaining fields.

#### [](#3-1-1-1-entry-method)3.1.1.1\. Entry Method

The \_LPI object uses a “Resource Descriptor”, which is formatted per[Chapter 2](ffh%5Fintroduction.html#resource%5Fdescriptor%5Fencoding), to specify the entry method for a lower power state. RISC-V systems set the resource descriptor as specified in[Table 1](#table%5Flpi%5Fentry%5Fmethod):

__Table 1\. LPI Entry Method__
| Field                 | Value                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| _Address Space_       | 0x7F (FFixedHW)                                                                                                                 |
| _Register Bit Width_  | 64                                                                                                                              |
| _Register Bit Offset_ | 0                                                                                                                               |
| _Access Size_         | 4 (QWord)                                                                                                                       |
| _Register Address_    | As specified in the Bits\[63:60\], Bits\[59:32\], and Bits\[31:0\] columns of[Table 2](#table%5Flpi%5Fentry%5Fmethod%5Faddress) |

__Table 2\. LPI Entry Method Address__
| Bits\[63:60\] (Type) | Bits\[59:32\] | Bits\[31:0\]              | Description                                  |
| -------------------- | ------------- | ------------------------- | -------------------------------------------- |
| 0x0                  | 0x000\_0000   | 0x0000\_0000              | WFI                                          |
| 0x1                  | 0x000\_0000   | SBI HSM hart suspend type | Suspend the hart using the SBI HSM extension |

All other encodings for LPI entry methods with _Address Space_ set to_FFixedHW_ (0x7f) are reserved for future use.

#### [](#3-1-1-2-arch-context-lost-flags)3.1.1.2\. Arch. Context Lost Flags

\_LPI objects also provide an _Arch. Context Lost Flags_ field, which is a 32-bit integer, and may be used to indicate what processor context is lost. RISC-V \_LPI objects must have appropriate flags set in this field as specified in [Table 3](#table%5Flpi%5Farch%5Fcontext%5Flost%5Fflags):

__Table 3\. LPI Arch. Context Lost Flags__
| Bit offset | Bit width | Description                              |
| ---------- | --------- | ---------------------------------------- |
| 0          | 1         | Set when the hart timer context is lost. |
| 1          | 31        | Reserved. Must be zero.                  |

[Appemdix A](#lpi%5Fexamples) provides examples for both a WFI entry method and SBI HSM hart suspend entry methods.

### [](#3-1-2-collaborative-processor-performance-control)3.1.2\. Collaborative Processor Performance Control

ACPI describes the Collaborative Processor Performance Control (CPPC) mechanism, which is an abstract and flexible mechanism for the operating system to collaborate with an entity in the platform to manage the performance of the harts. The platform entity may be the hart itself, the platform chipset, or a separate controller.

The ACPI \_CPC object provides a way for the operating system to transition the hart into a performance state selected from an abstract, continuous range of values. Fields in the \_CPC object may be static integers or “Resource Descriptors”. The following subsection specifies a RISC-V system “Resource Descriptor” for the \_CPC object.

#### [](#3-1-2-1-%5Fcpc-object-resource-descriptor)3.1.2.1\. \_CPC Object Resource Descriptor

The \_CPC object may use a “Resource Descriptor”, which is formatted per[Chapter 2](ffh%5Fintroduction.html#resource%5Fdescriptor%5Fencoding), for many of its fields. When using an FFH Resource Descriptor for a \_CPC field, it must be formatted as specified in[Table 4](#table%5Fcpc%5Fresource%5Fdescriptor):

__Table 4\. \_CPC Resource Descriptor__
| Field                 | Value                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| _Address Space_       | 0x7F (FFixedHW)                                                                                                                         |
| _Register Bit Width_  | 64                                                                                                                                      |
| _Register Bit Offset_ | 0                                                                                                                                       |
| _Access Size_         | 4 (QWord)                                                                                                                               |
| _Register Address_    | As specified in the Bits\[63:60\], Bits\[59:32\], Bits\[31:12\] and Bits\[11:0\] columns of[Table 5](#table%5Fcpc%5Fregister%5Faddress) |

__Table 5\. \_CPC Register Address__
| Bits\[63:60\] (Type) | Bits\[59:32\] | Bits\[31:12\]        | Bits\[11:0\]    | Description |
| -------------------- | ------------- | -------------------- | --------------- | ----------- |
| 0x1                  | 0x000\_0000   | SBI CPPC Register ID | SBI CPPC access |             |
| 0x2                  | 0x000\_0000   | 0x00000              | CSR number      | CSR access  |

All other encodings for \_CPC Resource Descriptors with _Address Space_set to _FFixedHW_ (0x7f) are reserved for future use.

[Appendix B](ffh%5Flpi%5Fexamples.html#cppc%5Fexamples) provides examples for both a CSR access and an SBI CPPC access.
