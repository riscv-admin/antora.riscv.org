# 2.1. RISC-V FFH Resource Descriptor Encoding

## [](#2-1-risc-v-ffh-resource-descriptor-encoding)2.1\. RISC-V FFH Resource Descriptor Encoding

Resource descriptors, which are formatted per the “Generic Register Descriptor” definition (\[ACPI 6.5\] section 6.4.3.7, also see ASL Register in section 19.6.114), are used by ACPI tables to provide the OSPM read and/or write access to platform-specific “registers”. A resource descriptor may be a fixed value, hardware address, function or function parameter identifier, or any other encoding of its bits. While encodings are specific to their applications, RISC-V uses a common top-level encoding whenever possible. That encoding is:

* Register bit width is 64
* The uppermost 4 bits are used to specify the type of identifier represented in the remaining bits. The possible types are described in table[Table 1](#table%5Fffh%5Fresource%5Fdescriptor%5Fidentifier%5Ftype)

__Table 1\. RISC-V FFH Resource Descriptor Identifier Type__
| Type | Description                              |
| ---- | ---------------------------------------- |
| 0x0  | None / Other                             |
| 0x1  | Bits\[31:0\] represent an SBI identifier |
| 0x2  | Bits\[11:0\] represent a CSR identifier  |

**NOTE:** While it is possible for identical RISC-V FFH Resource Descriptor addresses to appear across ACPI tables, the addresses may not share the same semantics. Each address must be interpreted per its respective ACPI table type.
