# 5.1. IOMMU Extension for QoS ID

## [](#QOS%5FIOMMU)5.1\. IOMMU Extension for QoS ID

A method to associate QoS IDs with requests to access resources by the Input-Output Memory Management Unit (IOMMU), as well as with devices governed by it, is required for effective monitoring and allocation. This section specifies a RISC-V I OMMU \[[5](qos%5Fbiblio.html#bib-iommu)\] extension for the following goals:

* Configure and associate QoS IDs for device-originated requests.
* Configure and associate QoS IDs for IOMMU-originated requests.

The size (or width) of `RCID` and `MCID`, as fields in registers or in data structures, supported by the IOMMU must be at least as large as that supported by any RISC-V application processor hart in the system.

### [](#5-1-1-iommu-registers)5.1.1\. IOMMU Registers

The specified memory-mapped register layout defines a new IOMMU register named`iommu_qosid`. This register is used to configure the Quality of Service (QoS) IDs associated with IOMMU-originated requests. The register is 4 bytes in size and is located at an offset of 624 from the beginning of the memory-mapped region.

__Table 1\. IOMMU Memory-mapped Register Layout__
| Offset | Name         | Size | Description                    | Is Optional? |
| ------ | ------------ | ---- | ------------------------------ | ------------ |
| 624    | iommu\_qosid | 4    | QoS IDs for IOMMU requests.    | Yes          |
| 628    | Reserved     | 60   | Reserved for future use (WPRI) |              |

#### [](#5-1-1-1-reset-behavior)5.1.1.1\. Reset Behavior

If the reset value for `ddtp.iommu_mode` field is `Bare`, then the`iommu_qosid.RCID` field must have a reset value of 0.

| |  At reset, it is required that the RCID field of iommu\_qosid is set to 0 if the IOMMU is in Bare mode, as typically the resource controllers in the SoC default to a reset behavior of associating all capacity or bandwidth to theRCID value of 0\. When the reset value of the ddtp.iommu\_mode is not Bare, the iommu\_qosid register should be initialized by software before changing the mode to allow DMA. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#5-1-1-2-iommu-capabilities)5.1.1.2\. IOMMU Capabilities

The IOMMU `capabilities` register is extended with a new field, `QOSID`, which enumerates support for associating QoS IDs with requests made through the IOMMU.

![IOMMU Capabilities Register](_images/diag-8fedf47ed65b4b85827d8c6395d82ac72cf74f30.svg) 

Figure 1\. IOMMU Capabilities Register

| Bits | Field | Attribute | Description                                     |
| ---- | ----- | --------- | ----------------------------------------------- |
| 41   | QOSID | RO        | Associating QoS IDs with requests is supported. |

#### [](#5-1-1-3-iommu-qos-id)5.1.1.3\. IOMMU QoS ID

The `iommu_qosid` register fields are defined as follows:

![`iommu_qosid` register fields](_images/diag-c4837722535117106755568dc19ec27db080323f.svg) 

Figure 2\. `iommu_qosid` register fields

| Bits  | Field    | Attribute | Description                        |
| ----- | -------- | --------- | ---------------------------------- |
| 11:0  | RCID     | WARL      | RCID for IOMMU-initiated requests. |
| 15:12 | reserved | WPRI      | Reserved for standard use.         |
| 27:16 | MCID     | WARL      | MCID for IOMMU-initiated requests. |
| 31:28 | reserved | WPRI      | Reserved for standard use.         |

IOMMU-initiated requests for accessing the following data structures use the value programmed in the `RCID` and `MCID` fields of the `iommu_qosid` register.

* Device directory table (`DDT`)
* Fault queue (`FQ`)
* Command queue (`CQ`)
* Page-request queue (`PQ`)
* IOMMU-initiated MSI (Message-signaled interrupts)

When `ddtp.iommu_mode == Bare`, all device-originated requests are associated with the QoS IDs configured in the `iommu_qosid` register.

### [](#5-1-2-device-context-fields)5.1.2\. Device-context Fields

The `ta` field of the device context is extended with two new fields, `RCID`and `MCID`, to configure the QoS IDs to associate with requests originated by the devices.

![Translation Attributes (`ta`) Field](_images/diag-665ffb960a23a4bd93e5f5584ae8dc7af50b3dfc.svg) 

Figure 3\. Translation Attributes (`ta`) Field

IOMMU-initiated requests for accessing the following data structures use the value configured in the `RCID` and `MCID` fields of `DC.ta`.

* Process directory table (`PDT`)
* Second-stage page table
* First-stage page table
* MSI page table
* Memory-resident interrupt file (`MRIF`)

The `RCID` and `MCID` configured in `DC.ta` are provided to the IO bridge on successful address translations. The IO bridge should associate these QoS IDs with device-initiated requests.

If `capabilities.QOSID` is 1 and `DC.ta.RCID` or `DC.ta.MCID` is wider than that supported by the IOMMU, a `DC` with `DC.tc.V=1` is considered misconfigured. In this case, the IOMMU should stop and report "DDT entry misconfigured" (cause = 259).

### [](#5-1-3-iommu-atc-capacity-allocation-and-monitoring)5.1.3\. IOMMU ATC Capacity Allocation and Monitoring

Some IOMMUs might support capacity allocation and usage monitoring in the IOMMU address translation cache (IOATC) by implementing the capacity controller register interface.

Additionally, some IOMMUs might support multiple IOATCs, each potentially having different capacities. In scenarios where multiple IOATCs are implemented, such as an IOATC for each supported page size, the IOMMU can implement a capacity controller register interface for each IOATC to facilitate individual capacity allocation.
