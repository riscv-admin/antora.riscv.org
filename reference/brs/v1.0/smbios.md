# 7.1. BRS-I SMBIOS Requirements

## [](#smbios)7.1\. BRS-I SMBIOS Requirements

The _System Management BIOS (SMBIOS) Reference Specification_ defines a standard format for presenting management information about an implementation, mostly focusing on hardware components.

This section defines the BRS-I mandatory and optional SMBIOS requirements on top of existing \[[9](bibliography.html#bib-smbios)\] specification requirements. Additional non-normative guidance may be found in the [firmware implementation guidance](#smbios-guidance) section.

| |  All content in this section is optional and recommended for BRS-B. |
| --------------------------------------------------------------------- |

| |  The structures and fields in this section are defined in a manner consistent with the DMTF specification language (\[[9](bibliography.html#bib-smbios)\]). |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| ID#                                                                                                                                  | Rule                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SMBIOS\_010                                                                                                                          | A Baseboard/Module Information (Type 02) structure SHOULD be implemented.                                                                                       |
| _This relaxes the SMBIOS specification requirement._                                                                                 |                                                                                                                                                                 |
| SMBIOS\_020                                                                                                                          | Processor Information (Type 04) structures, meeting the additional [7.1.1\. Type 04 Processor Information](#smbios-type04) clarifications, MUST be implemented. |
| _This supersedes the RISC-V specific language in the SMBIOS specification (\[[9](bibliography.html#bib-smbios)\], Section 7.5.3.5)._ |                                                                                                                                                                 |
| SMBIOS\_030                                                                                                                          | Port Connector Information (Type 08) structures SHOULD be implemented.                                                                                          |
| SMBIOS\_040                                                                                                                          | BIOS Language Information (Type 13) structures SHOULD be implemented.                                                                                           |
| SMBIOS\_050                                                                                                                          | An IPMI Device Information (Type 38) structure MUST be implemented, when an IPMIv1.0 host interface is present.                                                 |
| SMBIOS\_060                                                                                                                          | System Power Supply (Type 39) structures SHOULD be implemented.                                                                                                 |
| SMBIOS\_070                                                                                                                          | Onboard Devices Extended Information (Type 41) structures SHOULD be implemented.                                                                                |
| SMBIOS\_080                                                                                                                          | A Redfish Host Interface (Type 42) structure MUST be implemented, when a Redfish host interface is present.                                                     |
| SMBIOS\_090                                                                                                                          | A TPM Device (Type 43) structure MUST be implemented, when a TPM is present.                                                                                    |
| SMBIOS\_100                                                                                                                          | Processor Additional Information (Type 44) structures MUST be implemented.                                                                                      |
| _See the [structure definitions below](#smbios-type44)_.                                                                             |                                                                                                                                                                 |
| SMBIOS\_110                                                                                                                          | Firmware Inventory Information (Type 45) structures SHOULD be implemented.                                                                                      |

### [](#smbios-type04)7.1.1\. Type 04 Processor Information

| |  The information in this section supersedes the definitions in (\[[9](bibliography.html#bib-smbios)\], Section 7.5.3.4). |
| -------------------------------------------------------------------------------------------------------------------------- |

A processor is a grouping of harts in a physical package. In modern designs this MAY mean an SoC.

For RISC-V class CPUs, the `Processor ID` field contains two `DWORD`\-formatted values describing the overall physical processor package vendor and version. For some implementations this may also be known as the SoC ID. The first `DWORD` (offsets 08h-0Bh) is the JEP-106 code for the vendor, where bits 6:0 is the ID without the parity and bits 31:7 represent the number of continuation codes. The second `DWORD` (offsets 0Ch-0Fh) reflects vendor-specific part versioning.

For hart-specific vendor and revision information, please see [7.1.2\. Type 44 Processor-Specific Data](#smbios-type44).

### [](#smbios-type44)7.1.2\. Type 44 Processor-Specific Data

The processor-specific data structure fields are defined to follow the standard Processor-Specific Block fields (\[[9](bibliography.html#bib-smbios)\], Section 7.45.1).

The structure is valid for processors declared with `Processor Type` 07h (64-bit RISC-V) only.

A Type 44 structure needs to be provided for every hart meeting [\[hart\]](#hart) requirements.

| Offset | Version | Name                      | Length | Value  | Description                                                                                                                                                                                                                                            |
| ------ | ------- | ------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 00h    | 0100h   | Revision                  | WORD   | Varies | See [7.1.3\. Processor-Specific Data Structure Versioning](#smbios-psd-ver).                                                                                                                                                                           |
| 02h    | 0100h   | Hart ID                   | QWORD  | Varies | The ID of this RISC-V hart.                                                                                                                                                                                                                            |
| 0Ah    | 0100h   | Machine Vendor ID         | QWORD  | Varies | The vendor ID of this RISC-V hart.                                                                                                                                                                                                                     |
| 12h    | 0100h   | Machine Architecture ID   | QWORD  | Varies | Base microarchitecture of the hart. Value of 0 is possible to indicate the field is not implemented. The combination of Machine Architecture ID and Machine Vendor ID should uniquely identify the type of hart microarchitecture that is implemented. |
| 1Ah    | 0100h   | Machine Implementation ID | QWORD  | Varies | Unique encoding of the version of the processor implementation.                                                                                                                                                                                        |

### [](#smbios-psd-ver)7.1.3\. Processor-Specific Data Structure Versioning

The processor-specific data structure begins with a revision field to allow for future extensibility in a backwards-compatible manner.

The minor revision is to be incremented anytime new fields are added in a backwards-compatible manner. The major revision is to be incremented on backwards-incompatible changes.

| Version | Bits 15:8+ Major revision | Bits 7:0+ Minor revision | Combined | Description                  |
| ------- | ------------------------- | ------------------------ | -------- | ---------------------------- |
| v1.0    | 01h                       | 00h                      | 0100h    | First BRS-defined definition |
