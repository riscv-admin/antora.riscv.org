# 1.1. Introduction

## [](#intro)1.1\. Introduction

Quality of Service (QoS) is defined as the minimal end-to-end performance that is guaranteed in advance by a service level agreement (SLA) to a workload. A workload can be a single application, a group of applications, a virtual machine, a group of virtual machines, or a combination of those. The performance is measured in the form of metrics such as instructions per cycle (IPC), latency of servicing work, etc.

Various factors such as the available cache capacity, memory bandwidth, interconnect bandwidth, CPU cycles, system memory, and so on affect the performance of a computing system that runs multiple workloads concurrently. Furthermore, during arbitration for shared resources, the prioritization of the workloads' requests against other competing requests might also affect the performance of the workload. Such interference due to resource sharing can lead to unpredictable workload performance \[[1](qos%5Fbiblio.html#bib-ptcamp)\].

When multiple workloads are running concurrently on modern processors with large core counts, multiple cache hierarchies, and multiple memory controllers, the performance of a workload can become less deterministic or even non-deterministic. This situation occurs because the worload performance depends on the behavior of the other workloads in the machine that contend for the shared resources, which can lead to interference. In many deployment scenarios, such as public cloud servers, the workload owner might not be in control of the type and placement of other workloads in the platform.

System software can control some of these resources available to the workload, such as the number of hardware threads made available for execution, the amount of system memory allocated to the workload, and the number of CPU cycles provided for execution.

System software needs additional tools to control interference to a workload and thereby reduce the variability in the performance that is experienced by one workload due to other workloads' cache capacity usage, memory bandwidth usage, interconnect bandwidth usage, and so on through a resource allocation capability. The resource allocation capability enables system software to reserve capacity and/or bandwidth to meet the performance goals of the workload. Such controls can improve the utilization of the system by co-locating workloads while minimizing the interference caused by one workload to another \[[2](qos%5Fbiblio.html#bib-heracles)\].

Effective use of the resource allocation capability requires the hardware to provide a resource monitoring capability by which the resource requirements of a workload needed to meet a certain performance goal can be characterized. A typical use model involves profiling the resource usage of the workload by using the resource monitoring capability and to establish resource allocations for the workload by using the resource allocation capability.

The allocation might be in the form of capacity or bandwidth, depending on the type of resource. For caches, TLBs, and directories, the resource allocation is in the form of storage capacity. For interconnects and memory controllers, the resource allocation is in the form of bandwidth.

Workloads generate different types of accesses to shared resources. For example, some of the requests might be for accessing instructions and other requests might be to access data that is operated on by the workload. Certain data accesses might not have temporal locality, whereas others can have a high probability of reuse. In some cases, you can provide differentiated treatment to each type of access by providing unique resource allocation to each access type.

RISC-V Capacity and Bandwidth Controller QoS Register Interface (CBQRI) specification specifies the following identifiers and interfaces:

1. QoS identifiers to identify workloads that originate requests to the shared resources. These QoS identifiers include an identifier for resource allocation configurations and an identifier for the monitoring counters used to monitor resource usage. These identifiers accompany each request that is made by the workload to the shared resource. [\[QOS\_ID\]](#QOS%5FID) specifies the mechanism to associate the identifiers with workloads.
2. Access-type identifiers to accompany request to access a shared resource to allow differentiated treatment of each access-type (for example, code vs. data,). The access-types are defined in [\[QOS\_ID\]](#QOS%5FID).
3. Register interface for capacity allocation in controllers, such as shared caches, directories, and so on. The capacity allocation register interface is specified in [\[CC\_QOS\]](#CC%5FQOS).
4. Register interface for capacity usage monitoring. The capacity usage monitoring register interface is specified in [\[CC\_QOS\]](#CC%5FQOS).
5. Register interface for bandwidth allocation in controllers, such as interconnect and memory controllers. The bandwidth allocation register interface is specified in [\[BC\_QOS\]](#BC%5FQOS).
6. Register interface for bandwidth usage monitoring. The bandwidth usage monitoring register interface is specified in [\[BC\_QOS\]](#BC%5FQOS).

The capacity and bandwidth controller register interfaces for resource allocation and usage monitoring are defined as memory-mapped registers. Each controller that supports CBQRI provides a set of registers that are memory-mapped, starting at an 8-byte aligned physical address. The memory-mapped registers can be accessed by using naturally aligned 4-byte or 8-byte memory accesses. The controller behavior for register accesses where the address is not aligned to the size of the access, or if the access spans multiple registers, or if the size of the access is not 4 bytes or 8 bytes, is `UNSPECIFIED`. A 4-byte access to a register must be single-copy atomic. Whether an 8-byte access to a CBQRI register is single-copy atomic is considered `UNSPECIFIED`. This type of access can appear, internally to the CBQRI implementation, as if two separate 4-byte accesses are performed.

| |  The CBQRI registers are defined so that software can perform two individual 4 byte accesses, or hardware can perform two independent 4 byte transactions resulting from an 8 byte access, to the high and low halves of the register as long as the register semantics, with regards to side-effects, are respected between the two software accesses, or two hardware transactions, respectively. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The controller registers use little-endian byte order (even if all harts are big-endian-only).

| |  Big-endian-configured harts that make use of the register interface might implement the REV8 byte-reversal instruction defined by the Zbb extension. IfREV8 is not implemented, then endianness conversion might be implemented by using a sequence of instructions. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

A controller can support a subset of capabilities that are defined by CBQRI. When a capability is not supported, the registers and/or fields used to configure and/or control such capabilities are hardwired to `0`. Each controller supports a capabilities register to enumerate the supported capabilities.
