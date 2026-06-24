# 2.1. QoS Identifiers

## [](#QOS%5FID)2.1\. QoS Identifiers

Monitoring or allocation of resources requires a way to identify the originator of the request to access the resource.

CBQRI and the Ssqosid extension provides a mechanism by which a workload can be associated with a resource control ID (`RCID`) and a monitoring counter ID (`MCID`) that accompany each request made by the workload to shared resources.

To provide differentiated services to workloads, CBQRI defines a mechanism to configure resource usage limits, in the form of capacity or bandwidth, per supported access type, for an `RCID` in the resource controllers that control accesses to such shared resources.

To monitor the resource utilization by a workload, CBQRI defines a mechanism to configure counters identified by the `MCID` to count events in the resource controllers that control accesses to such shared resources.

[\[QOS\_SIZING\]](#QOS%5FSIZING) discusses guidelines for sizing the QoS IDs and the need for differentiated IDs for monitoring. All supported `RCID` and `MCID` can be actively used in the system at any instance.

### [](#EMCID)2.1.1\. Associating `RCID` and `MCID` with requests

The `RCID` in the request is used by the resource controllers to determine the resource allocations (for example, cache occupancy limits, memory bandwidth limits, and so on) to enforce.

The `MCID` in the request is used by the resource controllers to identify the ID of a counter to monitor resource usage (for example, cache occupancy, memory bandwidth, and so on). Two modes of operation are supported by CBQRI. In the direct mode, the`MCID` carried with the request is directly used by the controller to identify the counter and is the effective `MCID`. In the RCID-prefixed mode, the controller identifies the counter for monitoring using an effective `MCID`computed as: .

Legal values of `P` range from 0 to 12 and are enumerated in the capability register of the controller. Software should use the effective `MCID` as the`MCID` operand to the controller for operations on the monitoring counters.

#### [](#2-1-1-1-risc-v-hart-initiated-requests-ssqosid)2.1.1.1\. RISC-V hart initiated requests (Ssqosid)

The Ssqosid extension \[[3](qos%5Fbiblio.html#bib-ssqosid)\] introduces a read/write S/HS-mode register (`srmcfg`) to configure QoS Identifiers to be used with requests made by the hart to shared resources. If Smstateen \[[4](qos%5Fbiblio.html#bib-stateen)\] is implemented then bit 55 of `mstateen0` controls access to `srmcfg` from privilege modes less than M.

#### [](#2-1-1-2-device-initiated-requests)2.1.1.2\. Device initiated requests

A RISC-V IOMMU \[[5](qos%5Fbiblio.html#bib-iommu)\] extension to support configuring QoS identifiers is specified in [\[QOS\_IOMMU\]](#QOS%5FIOMMU). If the system supports an IOMMU with this extension, the IOMMU can be configured with the `RCID` and `MCID` to associate with requests from devices and from the IOMMU itself.

If the system does not support an IOMMU with this extension, then the association of `RCID` and `MCID` with requests from devices becomes implementation-defined. Such methods can include, but are not limited to, one of the following examples:

* Devices can be configured with an `RCID` and `MCID` for requests originating from the device, provided the device implementation and the bus protocol used by the device support such capabilities. The method to configure the QoS identifiers into devices remains `UNSPECIFIED`.
* Where the device does not natively support being configured with an `RCID`and `MCID`, the implementation might provide a shim at the device interface. This shim can be configured with the `RCID` and `MCID` to associate with requests originating from the device. The method to configure such QoS identifiers into a shim is `UNSPECIFIED`.

### [](#2-1-2-access-type-at)2.1.2\. Access type (`AT`)

In some usages, in addition to providing differentiated service among workloads, the ability to differentiate between resource usage for accesses made by the same workload might be required. For example, the capacity allocated in a shared cache for code storage might be differentiated from the capacity allocated for data storage and thereby avoid code from being evicted from such shared cache due to a data access.

When differentiation based on access type (for example, code vs. data) is supported the requests also carry an access-type (`AT`) indicator. The resource controllers can be configured with separate capacity and/or bandwidth allocations for each supported access type. CBQRI defines a 3-bit `AT` field, encoded as specified in[Table 1](#AT%5FENC), in the register interface to configure differentiated resource allocation and monitoring for each `AT`.

__Table 1\. Encodings of AT field__
| Value | Name     | Description                       |
| ----- | -------- | --------------------------------- |
| 0     | Data     | Requests to access data.          |
| 1     | Code     | Requests for code execution.      |
| 2-5   | Reserved | Reserved for future standard use. |
| 6-7   | Custom   | Designated for custom use.        |

For unsupported `AT` values the resource controller behaves as if `AT` was 0.
