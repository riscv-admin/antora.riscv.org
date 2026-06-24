# 3.1. ID Mapping Examples

## [](#Mapping-Examples)3.1\. ID Mapping Examples

__Table 1\. PCIe device ID mapping example__
| **Source ID Base** | **Number of IDs** | **Destination Device ID Base** | **Destination IOMMU Offset** | **Flags** |
| ------------------ | ----------------- | ------------------------------ | ---------------------------- | --------- |
| 0x0000             | 0x10              | 0x0                            | IOMMU0\_OFFSET\_IN\_RIMT     | 0         |
| 0x0100             | 0x10              | 0x10                           | IOMMU0\_OFFSET\_IN\_RIMT     | 0         |

__Table 2\. Platform device ID mapping example__
| **Source ID Base** | **Number of IDs** | **Destination Device ID Base** | **Destination IOMMU Offset** | **Flags** |
| ------------------ | ----------------- | ------------------------------ | ---------------------------- | --------- |
| 0x0000             | 0x1               | 0x20                           | IOMMU0\_OFFSET\_IN\_RIMT     | 0         |
