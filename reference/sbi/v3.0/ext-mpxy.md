# 20.1. Message Proxy Extension (EID #0x4D505859 “MPXY”)

## [](#20-1-message-proxy-extension-eid-0x4d505859-mpxy)20.1\. Message Proxy Extension (EID #0x4D505859 “MPXY”)

The Message Proxy (MPXY) extension allows the supervisor software to send and receive messages through the SBI implementation. This extension defines a generic interface that allows the supervisor software to implement clients for various messaging protocols implemented by the SBI implementation (such as RPMI cite:\[rpmi\], etc). The SBI MPXY is an abstract interface and agnostic of message protocol implementations in the SBI implementation. The message format used by a client in the supervisor software to send/receive messages through the SBI MPXY extension is defined by the corresponding message protocol specification.

This extension requires a per-hart shared memory between the supervisor software and the SBI implementation for message data transfer. This per-hart shared memory is different from the message protocol specific shared memory that is used between the SBI implementation and the remote entity that implements the message protocol. The remote entity can be implemented as a system-level partition on the same hart or as firmware running on a platform microcontroller or emulated by an SBI implementation. The supervisor software MUST call the `sbi_mpxy_set_shmem` function to set up the shared memory before calling any other function defined in the extension.

### [](#20-1-1-sbi-mpxy-and-dedicated-sbi-extension-rule)20.1.1\. SBI MPXY and Dedicated SBI extension rule

The implementation may only provide either an SBI MPXY or a dedicated SBI extension interface for a specific functionality within the specified message protocol, but never both.

### [](#20-1-2-message-channels)20.1.2\. Message Channels

The MPXY extension defines an abstract message channel which is identified by a unique 32 bits unsigned integer referred to as `channel_id`. The supervisor software can discover the `channel_id` of a message channel using standard hardware discovery mechanisms. The message protocol specification associated with a message channel is discovered through the standard message channel attributes defined in the following sections.

The type of message data, or the group of messages, that may be transmitted over an MPXY message channel is defined by the message protocol specification. The message protocol specification may define multiple message groups, but may allow only a selected set of messages accessible to the supervisor software via the MPXY extension.

| |  Any channel\_id exported to the supervisor software via the hardware discovery mechanism is implicitly associated with a particular message protocol transport. This binding is internal to the SBI implementation. To the supervisor software, a message channel is an abstract entity with associated attributes that can be accessed through the MPXY extension. The message channel attributes describe the characteristics of a message channel depending on the associated message protocol. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#20-1-3-message-channel-attributes)20.1.3\. Message Channel Attributes

Each message channel (`channel_id`) has a set of associated attributes which are identified by a unique 32 bits unsigned integer called `attribute_id` where each attribute value is 32 bits wide.

The message channel attributes are divided into two categories: standard attributes and message protocol specific attributes. The encoding of message channel `attribute_id` is as follows:

```c
attribute_id[31] = 0 (Standard)
attribute_id[31] = 1 (Message protocol)
```

Standard attributes are defined by the MPXY extension and all message channels MUST support these attributes. Apart from standard attributes, a message channel may also have message protocol attributes which are defined by the message protocol specification.

Once supervisor software has verified the channel and its associated attributes, it can use the MPXY interface to send messages over the message channel where each message is identified by a 32 bit unsigned integer called `message_id`. The set of `message_id` that can be sent over an MPXY channel are defined by the message protocol specification.

__Table 1\. MPXY Channel Attributes__
| Attribute Name              | Attribute ID            | Access                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSG\_PROT\_ID               | 0x00000000              | RO                                                                                                             | **Message Protocol Identifier**Unique ID for identifying the message protocol specification. The table[Table 2](#table%5Fmpxy%5Fmessage%5Fprotocol%5Fid) provides a list of supported message protocol specifications and their IDs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| MSG\_PROT\_VERSION          | 0x00000001              | RO                                                                                                             | **Message Protocol Version**Version of the message protocol specification. \[31:16\]: Major version.  \[15:0\]: Minor version. If the message protocol specification has additional version fields or if the above encoding is not suitable, the message protocol specification may define message protocol specific attribute for discovering the version of the message protocol specification.                                                                                                                                                                                                                                                                                                                                               |
| MSG\_DATA\_MAX\_LEN         | 0x00000002              | RO                                                                                                             | **Maximum Message Data Length**Maximum message data size in bytes supported by the message channel to send or receive message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MSG\_SEND\_TIMEOUT          | 0x00000003              | RO                                                                                                             | **Message Send Timeout**Timeout for sending a message in microseconds as supported by the message protocol specification. Functions which do not wait for response can use this timeout value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MSG\_COMPLETION\_TIMEOUT    | 0x00000004              | RO                                                                                                             | **Message Completion Timeout**This is the aggregate of MSG\_SEND\_TIMEOUT and the response receive timeout in microseconds as supported by the message protocol specification. Functions which wait for response can use this timeout value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CHANNEL\_CAPABILITY         | 0x00000005              | RO                                                                                                             | **Channel Capabilities Bits** \[31:6\]: Reserved and \`0\`    \[5\]: Get Notifications (FID #7)         Support    \[4\]: Send Message without         Response (FID #6) Support    \[3\]: Send Message with         Response (FID #5) Support    \[2\]: Events State Support    \[1\]: SSE Event    \[0\]: MSI Any defined bit as 1 means the corresponding capability is supported. The SBI implementation only needs to support one method to indicate the availability of notifications, either MSI or SSE. If both are enabled, the MSI is preferred over the SSE event. If Get Notifications function (FID #7) is not supported then the Events State Support, SSE Event and MSI bits must be 0.                                          |
| SSE\_EVENT\_ID              | 0x00000006              | RO                                                                                                             | **SSE Event ID**Channel SSE event ID if the SSE is supported as discovered viaCHANNEL\_CAPABILITY attribute. If the SSE is not supported then this value is unspecified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| MSI\_CONTROL                | 0x00000007              | RW                                                                                                             | **MSI Control**Control for MSI based indication. 0 = Disable 1 = Enable This attribute can be set to 1 if MSI\_ADDR\_LOW and MSI\_ADDR\_HIGHattributes point to a valid MSI target. If the message channel does not support MSI based indication as discovered via the CHANNEL\_CAPABILITY attribute, then MSI\_CONTROL ignore writes and always reads zero. The reset value of this attribute is 0.                                                                                                                                                                                                                                                                                                                                            |
| MSI\_ADDR\_LOW              | 0x00000008              | RW                                                                                                             | **MSI Address Low**Low 32 bits of the MSI target physical address. If the message channel does not support MSI based indication then this attribute ignores writes and always reads 0. The reset value of this attribute is 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MSI\_ADDR\_HIGH             | 0x00000009              | RW                                                                                                             | **MSI Address High**High 32 bits of the MSI target physical address. If the message channel does not support MSI based indication then this attribute ignores writes and always reads 0. The reset value of this attribute is 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| MSI\_DATA                   | 0x0000000A              | RW                                                                                                             | **MSI Data**MSI data word written to the MSI target. If the message channel does not support MSI based indication then this attribute ignores writes and always reads 0. The reset value of this attribute is 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| EVENTS\_STATE\_CONTROL      | 0x0000000B              | RW                                                                                                             | **Events State Control.**If the message channel supports notification events state data then this attribute can be used to enable state reporting like number of eventsRETURNED, REMAINING or LOST after a call to Get Notifications (FID #7) function. The reset value of this attribute is 0, which means disabled. If supervisor software wants to enable events state reporting, it MUST write 1. If the events state reporting is not supported by the channel or the Get Notifications (FID #7) function is not implemented as indicated by the CHANNEL\_CAPABILITY attribute, then the writes to this attribute will be ignored. More details on events state data are mentioned in the function Get Notifications (FID #7) description. |
| RESERVED                    | 0x0000000C - 0x7fffffff | Reserved for future use.                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Message Protocol Attributes | 0x80000000 - 0xffffffff | Attributes defined by the message protocol specification. Refer to message protocol specification for details. |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### [](#20-1-4-message-protocol-ids)20.1.4\. Message Protocol IDs

Each message protocol specification supporting MPXY extension will be assigned a 32 bits identifier which is listed in the table below. New message protocol enabling support for MPXY will need to be added in the below table with its assigned ID.

__Table 2\. MPXY Message Protocol IDs__
| Message Protocol Name | MSG\_PROT\_ID value     | Description                             |
| --------------------- | ----------------------- | --------------------------------------- |
| RPMI                  | 0x00000000              | RPMI cite:\[rpmi\]                      |
| RESERVED              | 0x00000001 - 0x7fffffff |                                         |
| Vendor Specific       | 0x80000000 - 0xffffffff | Custom vendor specific message protocol |

### [](#20-1-5-function-get-shared-memory-size-fid-0)20.1.5\. Function: Get shared memory size (FID #0)

```c
struct sbiret sbi_mpxy_get_shmem_size(void)
```

Get the shared memory size in number of bytes for sending and receiving messages.

The shared memory size returned by the SBI implementation MUST satisfy the following requirements:

1. The shared memory size MUST be same for all HARTs
2. The shared memory size MUST be at least 4096 bytes
3. The shared memory size MUST be multiple of 4096 bytes
4. The shared memory size MUST not be less than the biggest MSG\_DATA\_MAX\_LEN attribute value across all MPXY channels

This function always returns SBI\_SUCCESS in `sbiret.error` and it will return the shared memory size in `sbiret.uvalue`.

### [](#20-1-6-function-set-shared-memory-fid-1)20.1.6\. Function: Set shared memory (FID #1)

```c
struct sbiret sbi_mpxy_set_shmem(unsigned long shmem_phys_lo,
                                 unsigned long shmem_phys_hi,
                                 unsigned long flags)
```

Set the shared memory for sending and receiving messages on the calling hart.

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are not all-ones bit-wise then the `shmem_phys_lo` parameter specifies the lower XLEN bits and the `shmem_phys_hi` parameter specifies the upper XLEN bits of the shared memory physical base address. The `shmem_phys_lo` parameter MUST be 4096 bytes aligned and the shared memory size is assumed to be same as returned by the Get shared memory size function (FID #0).

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are all-ones bit-wise then shared memory is disabled.

The `flags` parameter specifies configuration for shared memory setup and it is encoded as follows:

```none
flags[XLEN-1:2]: Reserved for future use and must be zero.
flags[1:0]: Shared memory setup mode (Refer table below).
```

__Table 3\. MPXY Shared Memory Setup Mode__
| Mode             | flags\[1:0\] | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OVERWRITE        | 0b00         | Ignore the current shared memory state and force setup the new shared memory based on the passed parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| OVERWRITE-RETURN | 0b01         | Same as OVERWRITE mode and additionally after the new shared memory state is enabled, the old shared memory shmem\_phys\_lo and shmem\_phys\_hi are written in the same order to the new shared memory at offset 0x0. This flag provide provision to software layers in the supervisor software that want to send messages using the shared memory but do not know the shared memory details that has already been setup. Those software layers can temporarily setup their own shared memory on the calling hart, send messages and then restore back the previous shared memory with the SBI implementation. |
| RESERVED         | 0b10 - 0b11  | Reserved for future use. Must be initialized to 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

| |  The supervisor software may consist of several software layers, including an operating system and runtime firmware, which are mutually exclusive and without any provision for data exchange. Typically, a call is required to invoke the runtime firmware when required by the operating system, and once the runtime firmware has finished the task it returns control to the operating system.The operating system may setup the shared memory per-hart using theOVERWRITE flag during boot. The runtime firmware may also need to use the MPXY channel to send the message data when its invoked. In such a scenario the runtime firmware can setup its own MPXY channel shared memory on the called hart using the OVERWRITE-RETURN flag and when finished, can restore the previous shared memory before returning control to the operating system. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

The possible error codes returned in `sbiret.error` are below.

__Table 4\. MPXY Set Shared Memory Errors__
| Error code                 | Description                                                                                                                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | Shared memory was set or cleared successfully.                                                                                                                                                                                                             |
| SBI\_ERR\_INVALID\_PARAM   | The flags parameter has invalid value or the bits set are within the reserved range. Or the shmem\_phys\_lo parameter is not 4096 bytes aligned.                                                                                                           |
| SBI\_ERR\_INVALID\_ADDRESS | The shared memory pointed to by the shmem\_phys\_lo and shmem\_phys\_hiparameters does not satisfy the requirements described in[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter). |
| SBI\_ERR\_FAILED           | Failed due to other unspecified errors.                                                                                                                                                                                                                    |

| |  The supervisor software MUST call this function to setup the shared memory first before calling any other function in this extension. |
| ---------------------------------------------------------------------------------------------------------------------------------------- |

### [](#20-1-7-function-get-channel-ids-fid-2)20.1.7\. Function: Get Channel IDs (FID #2)

```c
struct sbiret sbi_mpxy_get_channel_ids(uint32_t start_index)
```

Get channel IDs of the message channels accessible to the supervisor software in the shared memory of the calling hart. The channel IDs are returned as an array of 32 bits unsigned integers where the `start_index` parameter specifies the array index of the first channel ID to be returned in the shared memory.

The SBI implementation will return channel IDs in the shared memory of the calling hart as specified by the table below:

__Table 5\. MPXY Channel IDs Shared Memory Layout__
| Offset             | Field                                | Description                                              |
| ------------------ | ------------------------------------ | -------------------------------------------------------- |
| 0x0                | REMAINING                            | Remaining number of channel IDs.                         |
| 0x4                | RETURNED                             | Number of channel IDs (N) returned in the shared memory. |
| 0x8                | CHANNEL\_ID \[start\_index + 0\]     | Channel ID                                               |
| 0xC                | CHANNEL\_ID \[start\_index + 1\]     | Channel ID                                               |
| 0x8 + ((N-1) \* 4) | CHANNEL\_ID \[start\_index + N - 1\] | Channel ID                                               |

The number of channel IDs returned in the shared memory are specified by the`RETURNED` field whereas the `REMAINING` field specifies the number of remaining channel IDs. If the `REMAINING` is not `0` then supervisor software can call this function again to get remaining channel IDs with `start_index`passed accordingly. The supervisor software may require multiple SBI calls to get the complete list of channel IDs depending on the `RETURNED` and`REMAINING` fields.

The `sbiret.uvalue` is always set to zero whereas the possible error codes returned in `sbiret.error` are below.

__Table 6\. MPXY Get Channel IDs Errors__
| Error code               | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| SBI\_SUCCESS             | The channel ID array has been written successfully.                   |
| SBI\_ERR\_INVALID\_PARAM | start\_index is invalid.                                              |
| SBI\_ERR\_NO\_SHMEM      | The shared memory setup is not done or disabled for the calling hart. |
| SBI\_ERR\_DENIED         | Getting channel ID array is not allowed on the calling hart.          |
| SBI\_ERR\_FAILED         | Failed due to other unspecified errors.                               |

### [](#20-1-8-function-read-channel-attributes-fid-3)20.1.8\. Function: Read Channel Attributes (FID #3)

```c
struct sbiret sbi_mpxy_read_attributes(uint32_t channel_id,
                                       uint32_t base_attribute_id,
                                       uint32_t attribute_count)
```

Read message channel attributes. The `channel_id` parameter specifies the message channel whereas `base_attribute_id` and `attribute_count` parameters specify the range of attribute ids to be read.

Supervisor software MUST call this function for the contiguous attribute range where the `base_attribute_id` is the starting index of that range and`attribute_count` is the number of attributes in the contiguous range. If there are multiple such attribute ranges then multiple calls of this function may be done from supervisor software. Supervisor software MUST read the message protocol specific attributes via separate call to this function with`base_attribute_id` and `attribute_count` without any overlap with the MPXY standard attributes.

Upon calling this function the message channel attribute values are returned starting from the offset `0x0` in the shared memory of the calling hart where the value of the attribute with `attribute_id = base_attribute_id + i` is available at the shared memory offset `4 * i`.

The possible error codes returned in `sbiret.error` are shown below.

__Table 7\. MPXY Read Channel Attributes Errors__
| Error code               | Description                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Message channel attributes has been read successfully.                                                           |
| SBI\_ERR\_INVALID\_PARAM | attribute\_count is 0.Or the attribute\_count > (shared memory size)/4. Or the base\_attribute\_id is not valid. |
| SBI\_ERR\_NOT\_SUPPORTED | channel\_id is not supported or invalid.                                                                         |
| SBI\_ERR\_BAD\_RANGE     | One of the attributes in the range specified by the base\_attribute\_id andattribute\_count do not exist.        |
| SBI\_ERR\_NO\_SHMEM      | The shared memory setup is not done or disabled for calling hart.                                                |
| SBI\_ERR\_FAILED         | Failed due to other unspecified errors.                                                                          |

### [](#20-1-9-function-write-channel-attributes-fid-4)20.1.9\. Function: Write Channel Attributes (FID #4)

```c
struct sbiret sbi_mpxy_write_attributes(uint32_t channel_id,
                                        uint32_t base_attribute_id,
                                        uint32_t attribute_count)
```

Write message channel attributes. The `channel_id` parameter specifies the message channel whereas `base_attribute_id` and `attribute_count` parameters specify the range of attribute ids.

Supervisor software MUST call this function for the contiguous attribute range where the `base_attribute_id` is the starting index of that range and`attribute_count` is the number of attributes in the contiguous range. If there are multiple such attribute ranges then multiple calls of this function may be done from supervisor software. Apart from contiguous attribute indices, supervisor software MUST also consider the attribute access permissions and attributes with RO (Read Only) access MUST be excluded from the attribute range. Supervisor software MUST write the message protocol specific attributes via separate call to this function with `base_attribute_id` and `attribute_count`without any overlap with the MPXY standard attributes.

Before calling this function, the supervisor software must populate the shared memory of the calling hart starting from offset 0x0 with the message channel attribute values. For each attribute with attribute\_id = base\_attribute\_id + i, the corresponding value MUST be placed at the shared memory offset 4 \* i.

The possible error codes returned in `sbiret.error` are shown below.

__Table 8\. MPXY Write Channel Attributes Errors__
| Error code               | Description                                                                                                                                                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Message channel attributes has been written successfully.                                                                                                                                                                                                                          |
| SBI\_ERR\_INVALID\_PARAM | attribute\_count is 0.Or the attribute\_count > (shared memory size)/4.Or the base\_attribute\_id is not valid.                                                                                                                                                                    |
| SBI\_ERR\_NOT\_SUPPORTED | channel\_id is not supported or invalid.                                                                                                                                                                                                                                           |
| SBI\_ERR\_BAD\_RANGE     | One of the attributes in the range specified by the base\_attribute\_id andattribute\_count do not exist or the attribute is read-only (RO).Or base\_attribute\_id and attribute\_count result into a range which overlaps with standard and message protocol specific attributes. |
| SBI\_ERR\_NO\_SHMEM      | The shared memory setup is not done or disabled for calling hart.                                                                                                                                                                                                                  |
| SBI\_ERR\_DENIED         | If any attribute write dependency is not satisfied.                                                                                                                                                                                                                                |
| SBI\_ERR\_FAILED         | Failed due to other unspecified errors.                                                                                                                                                                                                                                            |

### [](#20-1-10-function-send-message-with-response-fid-5)20.1.10\. Function: Send Message with Response (FID #5)

```c
struct sbiret
sbi_mpxy_send_message_with_response(uint32_t channel_id,
                                    uint32_t message_id,
                                    unsigned long message_data_len)
```

Send a message to the MPXY channel specified by the `channel_id` parameter and wait until a message response is received from the MPXY channel. The `message_id`parameter specifies the message protocol specific identification of the message to be sent whereas the `message_data_len` parameter represents the length of message data in bytes which is located at the offset `0x0` in the shared memory setup by the calling hart.

This function only succeeds upon receipt of a message response from the MPXY channel. In cases where complete data transfer requires multiple transmissions, the supervisor software shall send multiple messages as necessary. Details of such cases can be found in respective message protocol specifications.

Upon calling this function the SBI implementation MUST write the response message data at the offset `0x0` in the shared memory setup by the calling hart and the number of bytes written will be returned through `sbiret.uvalue`. The layout of data in case of both request and response is according to the respective message protocol specification message format.

Upon success, this function:  
1) Writes the message response data at offset `0x0` of the shared memory setup by the calling hart.  
2) Returns `SBI_SUCCESS` in `sbiret.error`.  
3) Returns message response data length in `sbiret.uvalue`.  

This function is optional. If this function is implemented, the corresponding bit in the `CHANNEL_CAPABILITY` attribute is set to `1`.

The possible error codes returned in `sbiret.error` are below.

__Table 9\. MPXY Send Message with Response Errors__
| Error code               | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Message sent and response received successfully.                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM | The message\_data\_len > MSG\_DATA\_MAX\_LEN for specified channel\_id.Or the message\_data\_len is greater than the size of shared memory on the calling hart. |
| SBI\_ERR\_NOT\_SUPPORTED | channel\_id is not supported or invalid.Or the message represented by the message\_id is not supported or invalid.Or this function is not supported.            |
| SBI\_ERR\_NO\_SHMEM      | The shared memory setup is not done or disabled for calling hart.                                                                                               |
| SBI\_ERR\_TIMEOUT        | Waiting for response timeout.                                                                                                                                   |
| SBI\_ERR\_IO             | Failed due to I/O error.                                                                                                                                        |
| SBI\_ERR\_FAILED         | Failed due to other unspecified errors.                                                                                                                         |

### [](#20-1-11-function-send-message-without-response-fid-6)20.1.11\. Function: Send Message without Response (FID #6)

```c
struct sbiret
sbi_mpxy_send_message_without_response(uint32_t channel_id,
                                       uint32_t message_id,
                                       unsigned long message_data_len)
```

Send a message to the MPXY channel specified by the `channel_id` parameter without waiting for a message response from the MPXY channel. The `message_id`parameter specifies the message protocol specific identification of the message to be sent whereas the `message_data_len` parameter represents the length of message data in bytes which is located at the offset `0x0` in the shared memory setup by the calling hart.

This function does not wait for message response from the channel and returns after successful message transmission. In cases where complete data transfer requires multiple transmissions, the supervisor software shall send multiple messages as necessary. Details of such cases can be found in the respective message protocol specification.

| |  The messages which do not have an expected response as per the underlying message protocol specification are also referred to as posted messages. This function should be only used for such posted messages. The respective message protocol specification should define a mechanism to track the status of posted messages using notification events or some other message with response if required. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

This function is optional. If this function is implemented, the corresponding bit in the `CHANNEL_CAPABILITY` attribute is set to `1`.

The possible error codes returned in `sbiret.error` are below.

__Table 10\. MPXY Send Message without Response Errors__
| Error code               | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Message sent successfully.                                                                                                                                      |
| SBI\_ERR\_INVALID\_PARAM | The message\_data\_len > MSG\_DATA\_MAX\_LEN for specified channel\_id.Or the message\_data\_len is greater than the size of shared memory on the calling hart. |
| SBI\_ERR\_NOT\_SUPPORTED | channel\_id is not supported or invalid.Or the message represented by the message\_id is not supported or invalid.Or this function is not supported.            |
| SBI\_ERR\_NO\_SHMEM      | The shared memory setup is not done or disabled for calling hart.                                                                                               |
| SBI\_ERR\_TIMEOUT        | Message send timeout.                                                                                                                                           |
| SBI\_ERR\_IO             | Failed due to I/O error.                                                                                                                                        |
| SBI\_ERR\_FAILED         | Failed due to other unspecified errors.                                                                                                                         |

### [](#20-1-12-function-get-notifications-fid-7)20.1.12\. Function: Get Notifications (FID #7)

```c
struct sbiret sbi_mpxy_get_notification_events(uint32_t channel_id)
```

Get the message protocol specific notification events on the MPXY channel specified by the `channel_id` parameter. The events are message protocol specific and MUST be defined in the respective message protocol specification. The SBI implementation may support indication mechanisms like MSI or SSE to inform the supervisor software about the availability of events.

| |  If the message channel does not support or is not configured for an indication mechanism, such as MSI or SSE, the supervisor software can periodically invoke the poll operation sbi\_mpxy\_get\_notification\_events. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  Notifications are asynchronous from the perspective of the supervisor software. Any caching or buffering mechanism is specific to the SBI implementation. The supervisor software may periodically poll for notification events using this function, provided that the polling frequency is sufficient to prevent the loss of events due to potential buffer limitations in the SBI implementation. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

Depending on the message protocol implementation, a channel may support events state which includes data like number of events `RETURNED`, `REMAINING` and`LOST`. Events state data is optional, and if the message protocol implementation supports it, then the channel will have the corresponding bit set in the`CHANNEL_CAPABILITY` attribute. By default the events state is disabled and supervisor software can explicitly enable it through the `EVENTS_STATE_CONTROL`attribute.

| |  Only after enabling the events state reporting through EVENTS\_STATE\_CONTROLattribute, the events state data will start getting accumulated by the SBI implementation. The supervisor software may enable the EVENTS\_STATE\_CONTROLattribute in the initialization phase if it is supported. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

In the shared memory, 16 bytes starting from offset `0x0` are used to return this state data.

Shared memory layout with events state data (each field is of 4 bytes):

```c
Offset 0x0: REMAINING
Offset 0x4: RETURNED
Offset 0x8: LOST
Offset 0xC: RESERVED
Offset 0x10: Start of message protocol specific notification events data
```

The `RETURNED` field represents the number of events which are returned in the shared memory when this function is called. The `REMAINING` field represents the number of events still remaining with SBI implementation. The supervisor software may need to call this function again until the `REMAINING` field becomes `0`.

The `LOST` field represents the number of events which are lost due to limited buffer size managed by the message protocol implementation. Details of buffering/caching of events is specific to message protocol implementation.

Upon calling this function the received notification events are written by the SBI implementation at the offset `0x10` in the shared memory setup by the calling hart irrespective of events state data reporting. If events state data reporting is disabled or not supported, then the values in events state fields are undefined. The number of the bytes written to the shared memory will be returned through `sbiret.uvalue` which is the number of bytes starting from offset `0x10`. The layout and encoding of notification events are defined by the message protocol specification associated with the message proxy channel (`channel_id`).

This function is optional. If this function is implemented, the corresponding bit in the `CHANNEL_CAPABILITY` attribute is set to `1`.

The possible error codes returned in `sbiret.error` are below.

__Table 11\. MPXY Get Notifications Errors__
| Error code               | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Notifications received successfully.                                       |
| SBI\_ERR\_NOT\_SUPPORTED | channel\_id is not supported or invalid.Or this function is not supported. |
| SBI\_ERR\_NO\_SHMEM      | The shared memory setup is not done or disabled for calling hart.          |
| SBI\_ERR\_IO             | Failed due to I/O error.                                                   |
| SBI\_ERR\_FAILED         | Failed due to other unspecified errors.                                    |

### [](#20-1-13-function-listing)20.1.13\. Function Listing

__Table 12\. MPXY Function List__
| Function Name                               | SBI Version | FID | EID        |
| ------------------------------------------- | ----------- | --- | ---------- |
| sbi\_mpxy\_get\_shmem\_size                 | 3.0         | 0   | 0x4D505859 |
| sbi\_mpxy\_set\_shmem                       | 3.0         | 1   | 0x4D505859 |
| sbi\_mpxy\_get\_channel\_ids                | 3.0         | 2   | 0x4D505859 |
| sbi\_mpxy\_read\_attributes                 | 3.0         | 3   | 0x4D505859 |
| sbi\_mpxy\_write\_attributes                | 3.0         | 4   | 0x4D505859 |
| sbi\_mpxy\_send\_message\_with\_response    | 3.0         | 5   | 0x4D505859 |
| sbi\_mpxy\_send\_message\_without\_response | 3.0         | 6   | 0x4D505859 |
| sbi\_mpxy\_get\_notification\_events        | 3.0         | 7   | 0x4D505859 |
