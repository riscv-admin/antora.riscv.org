# 10.1. Parameters and Discovery

## [](#10-1-parameters-and-discovery)10.1\. Parameters and Discovery

This document defines a number of parameters for describing aspects of the encoder such as the widths of buses, the presence or absence of optional features and the size of resources, as listed in[Table 1](#tab:iparameters) and [Table 2](#tab:dparameters).

Depending on the implementation, some parameters may be inherently fixed whilst others may be passed in to the design by some means.

__Table 1\. Parameters to the encoder - instruction trace__
| **Parameter name**       | **Range**                                                                                                                                                                                      | **Description**                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| _arch\_p_                | The architecture specification version with which the encoder is compliant (0 for initial version).                                                                                            |                                                                                     |
| _blocks\_p_              | Number of times **iretire**, **itype** etc. are replicated                                                                                                                                     |                                                                                     |
| _bpred\_size\_p_         | Number of entries in the branch predictor is 2**bpred\_size\_p**. Minimum number of entries is 2, so a value of 0 indicates that there is no branch predictor implemented.                     |                                                                                     |
| _cache\_size\_p_         | Number of entries in the jump target cache is 2**cache\_size\_p**. Minimum number of entries is 2, so a value of 0 indicates that there is no jump target cache implemented.                   |                                                                                     |
| _call\_counter\_size\_p_ | Number of bits in the nested call counter is 2**call\_counter\_size\_p**. Minimum number of entries is 2, so a value of 0 indicates that there is no implicit return call counter implemented. |                                                                                     |
| _ctype\_width\_p_        | Width of the **ctype** bus                                                                                                                                                                     |                                                                                     |
| _context\_width\_p_      | Width of **context** bus                                                                                                                                                                       |                                                                                     |
| _time\_width\_p_         | Width of **time** bus                                                                                                                                                                          |                                                                                     |
| _ecause\_width\_p_       | Width of **exception cause** bus                                                                                                                                                               |                                                                                     |
| _ecause\_choice\_p_      | Number of bits of exception cause to match using multiple choice                                                                                                                               |                                                                                     |
| _f0s\_width\_p_          | Width of the **subformat** field in format 0 _te\_inst_packets (see [\[sec:f0s\]](#sec:f0s)).                                                                                                  |                                                                                     |
| _filter\_context\_p_     | 0 or 1                                                                                                                                                                                         | Filtering on context supported when 1                                               |
| _filter\_time\_p_        | 0 or 1                                                                                                                                                                                         | Filtering on time supported when 1                                                  |
| _filter\_excint\_p_      | Filtering on exception cause or interrupt supported when non\_zero. Number of nested exceptions supported is 2filter\_excint\_p                                                                |                                                                                     |
| _filter\_privilege\_p_   | 0 or 1                                                                                                                                                                                         | Filtering on privilege supported when 1                                             |
| _filter\_tval\_p_        | 0 or 1                                                                                                                                                                                         | Filtering on trap value supported when 1 (provided _filter\_excint\_p_ is non-zero) |
| _iaddress\_lsb\_p_       | LSB of instruction **address** bus to trace. 1 if compressed instructions are supported, 2 otherwise                                                                                           |                                                                                     |
| _iaddress\_width\_p_     | Width of instruction **address** bus. This is the same as _DXLEN_                                                                                                                              |                                                                                     |
| _iretire\_width\_p_      | Width of the **iretire** bus                                                                                                                                                                   |                                                                                     |
| _ilastsize\_width\_p_    | Width of the **ilastsize** bus                                                                                                                                                                 |                                                                                     |
| _itype\_width\_p_        | Width of the **itype** bus                                                                                                                                                                     |                                                                                     |
| _nocontext\_p_           | 0 or 1                                                                                                                                                                                         | Exclude context from _te\_inst_ packets if 1                                        |
| _notime\_p_              | 0 or 1                                                                                                                                                                                         | Exclude time from _te\_inst_ packets if 1                                           |
| _privilege\_width\_p_    | Width of **privilege** bus                                                                                                                                                                     |                                                                                     |
| _retires\_p_             | Maximum number of instructions that can be retired per block                                                                                                                                   |                                                                                     |
| _return\_stack\_size\_p_ | Number of entries in the return address stack is 2**return\_stack\_size\_p**. Minimum number of entries is 2, so a value of 0 indicates that there is no implicit return stack implemented.    |                                                                                     |
| _sijump\_p_              | 0 or 1                                                                                                                                                                                         | **sijump** is used to identify sequentially inferable jumps                         |
| _impdef\_width\_p_       | Width of **implementation-defined input** bus                                                                                                                                                  |                                                                                     |

__Table 2\. Parameters to the encoder - data trace__
| **Parameter name**      | **Range**                        | **Description** |
| ----------------------- | -------------------------------- | --------------- |
| _daddress\_width\_p_    | Width of the **daddress** bus    |                 |
| _dblock\_width\_p_      | Width of the **dblock** bus      |                 |
| _data\_width\_p_        | Width of the **data** bus        |                 |
| _dsize\_width\_p_       | Width of the **dsize** bus       |                 |
| _dtype\_width\_p_       | Width of the **dtype** bus       |                 |
| _iaddr\_lsbs\_width\_p_ | Width of the **iaddr\_lsbs** bus |                 |
| _lrid\_width\_p_        | Width of the **lrid** bus        |                 |
| _lresp\_width\_p_       | Width of the **lresp** bus       |                 |
| _ldata\_width\_p_       | Width of the **ldata** bus       |                 |
| _sdata\_width\_p_       | Width of the **sdata** bus       |                 |

### [](#sec:disco)10.1.1\. Discovery of encoder parameters

To operate correctly, the decoder must be able to determine some of the encoder’s parameters at runtime, in the form of discoverable attributes. These parameters must be discoverable by the decoder, or else be fixed at the default value (in other words, if an encoder does not make a particular parameter discoverable, it must implement only the default value of that parameter, which the decoder will also use). [Table 3](#tab:requiredAttributes) lists the required discoverable attributes for instruction trace.

To access the discoverable attributes, some external entity, for example a debugger or a supervisory hart, must request it from the encoder. The encoder will provide the discovery information in one or more different formats. The preferred format is a packet which is sent over the trace infrastructure. Another format would be allowing the external entity to read the values from some register or memory mapped space maintained by the encoder. [10.1.2\. Example ipxact description](#sec:ipxact) gives an example of how this may be accomplished.

__Table 3\. Required instruction trace attributes__
| **Name**              | **Default** | **Parameter mapping**      |
| --------------------- | ----------- | -------------------------- |
| _arch_                | 0           | _arch\_p_                  |
| _bpred\_size_         | 0           | _bpred\_size\_p_           |
| _cache\_size_         | 0           | _cache\_size\_p_           |
| _call\_counter\_size_ | 0           | _call\_counter\_size\_p_   |
| _context\_width_      | 0           | _context\_width\_p_ \- 1   |
| _time\_width_         | 0           | _time\_width\_p_ \- 1      |
| _ecause\_width_       | 3           | _ecause\_width\_p_ \- 1    |
| _f0s\_width_          | 0           | _f0s\_width\_p_            |
| _iaddress\_lsb_       | 0           | _iaddress\_lsb\_p_ \- 1    |
| _iaddress\_width_     | 31          | _iaddress\_width\_p_ \- 1  |
| _nocontext_           | 1           | _nocontext_                |
| _notime_              | 1           | _notime_                   |
| _privilege\_width_    | 1           | _privilege\_width\_p_ \- 1 |
| _return\_stack\_size_ | 0           | _return\_stack\_size\_p_   |
| _sijump_              | 0           | _sijump\_p_                |

For ease of use it is further recommended that all of the encoder’s parameters be mapped to discoverable attributes, even if not directly required by the decoder. In particular, attributes related to filtering capabilities. [Table 4](#tab:optionalAttributes)lists the attributes associated with the filtering recommendations discussed in [\[ch:filtering\]](#ch:filtering), [Table 5](#tab:otherAttributes) lists attributes related to other instruction trace parameters mentioned in this document, and [Table 6](#tab:dataAttributes) lists attributes related to data trace.

__Table 4\. Optional filtering attributes__
| **Name**            | **Default** | **Parameter mapping** |
| ------------------- | ----------- | --------------------- |
| _comparators_       | 0           | _comparators\_p_ \- 1 |
| _filters_           | 0           | _filters\_p_ \- 1     |
| _ecause\_choice_    | 5           | _ecause\_choice\_p_   |
| _filter\_context_   | 1           | _filter\_context\_p_  |
| _filter\_time_      | 1           | _filter\_time\_p_     |
| _filter\_excint_    | 1           | _filter\_excint\_p_   |
| _filter\_privilege_ | 1           | _filter\_privilegep_  |
| _filter\_tval_      | 1           | _filter\_tval\_p_     |

__Table 5\. Other recommended attributes__
| **Name**           | **Default** | **Description**            |
| ------------------ | ----------- | -------------------------- |
| _ctype\_width_     | 0           | _ctype\_width\_p_ \- 1     |
| _ilastsize\_width_ | 0           | _ilastsize\_width\_p_ \- 1 |
| _itype\_width_     | 3           | _itype\_width\_p_ \- 1     |
| _iretire\_width_   | 1           | _iretire\_width\_p_ \- 1   |
| _retires_          | 0           | _retires\_p_ \- 1          |
| _impdef\_width_    | 0           | _impdef\_width\_p_ \- 1    |

__Table 6\. Data trace attributes__
| **Name**             | **Default** | **Description**              |
| -------------------- | ----------- | ---------------------------- |
| _daddress\_width_    | 31          | _daddress\_width\_p_ \- 1    |
| _dblock\_width_      | 0           | _dblock\_width\_p_ \- 1      |
| _data\_width_        | 31          | _data\_width\_p_ \- 1        |
| _dsize\_width_       | 2           | _dsize\_width\_p_ \- 1       |
| _dtype\_width_       | 0           | _dtype\_width\_p_ \- 1       |
| _iaddr\_lsbs\_width_ | 0           | _iaddr\_lsbs\_width\_p_ \- 1 |
| _lrid\_width_        | 0           | _lrid\_width\_p_ \- 1        |
| _lresp\_width_       | 0           | _lresp\_width\_p_ \- 1       |
| _ldata\_width_       | 31          | _ldata\_width\_p_ \- 1       |
| _sdata\_width_       | 31          | _sdata\_width\_p_ \- 1       |

### [](#sec:ipxact)10.1.2\. Example ipxact description

This section provides an example of discovery information represented in the ipxact form.

```xml
<?xmlversion="1.0" encoding="UTF-8"?>
<ipxact:component
xmlns:ipxact="http://www.accellera.org/XMLSchema/IPXACT/1685-2014"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.accellera.org/XMLSchema/IPXACT/1685-2014
http://www.accellera.org/XMLSchema/IPXACT/1685-2014/index.xsd">
<ipxact:vendor>Siemens</ipxact:vendor>
<ipxact:library>TraceEncoder</ipxact:library>
<ipxact:name>TraceEncoder</ipxact:name>
<ipxact:version>0.8</ipxact:version>
<ipxact:memoryMaps>
<ipxact:memoryMap>
<ipxact:name>TraceEncoderRegisterMap</ipxact:name>
<ipxact:addressBlock>
<ipxact:name>>TraceEncoderRegisterAddressBlock</ipxact:name>
<ipxact:baseAddress>0</ipxact:baseAddress>
<ipxact:range>128</ipxact:range>
<ipxact:width>64</ipxact:width>

<ipxact:register>
<ipxact:name>discovery_info_0</ipxact:name>
<ipxact:addressOffset>'h0</ipxact:addressOffset>
<ipxact:size>64</ipxact:size>
<ipxact:access>read-only</ipxact:access>
<ipxact:field>
<ipxact:name>version</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>0</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>minor_revision</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>4</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>arch</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>8</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>bpred_size</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>12</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>cache_size</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>16</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>call_counter_size</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>20</ipxact:bitOffset>
<ipxact:bitWidth>3</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>comparators</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>23</ipxact:bitOffset>
<ipxact:bitWidth>3</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>context_type_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>26</ipxact:bitOffset>
<ipxact:bitWidth>5</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>context_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>31</ipxact:bitOffset>
<ipxact:bitWidth>5</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>ecause_choice</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>36</ipxact:bitOffset>
<ipxact:bitWidth>3</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>ecause_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>39</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>filters</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>43</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>filter_context</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>47</ipxact:bitOffset>
<ipxact:bitWidth>1</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>filter_excint</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>48</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>filter_privilege</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>52</ipxact:bitOffset>
<ipxact:bitWidth>1</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>filter_tval</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>53</ipxact:bitOffset>
<ipxact:bitWidth>1</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>filter_impdef</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>54</ipxact:bitOffset>
<ipxact:bitWidth>1</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>f0s_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>55</ipxact:bitOffset>
<ipxact:bitWidth>2</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>iaddress_lsb</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>57</ipxact:bitOffset>
<ipxact:bitWidth>2</ipxact:bitWidth>
</ipxact:field>
</ipxact:register>

<ipxact:register>
<ipxact:name>discovery_info_1</ipxact:name>
<ipxact:addressOffset>'h4</ipxact:addressOffset>
<ipxact:size>64</ipxact:size>
<ipxact:access>read-only</ipxact:access>
<ipxact:field>
<ipxact:name>iaddress_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>0</ipxact:bitOffset>
<ipxact:bitWidth>7</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>ilastsize_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>7</ipxact:bitOffset>
<ipxact:bitWidth>7</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>itype_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>14</ipxact:bitOffset>
<ipxact:bitWidth>7</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>iretire_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>21</ipxact:bitOffset>
<ipxact:bitWidth>7</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>nocontext</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>28</ipxact:bitOffset>
<ipxact:bitWidth>1</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>privilege_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>29</ipxact:bitOffset>
<ipxact:bitWidth>2</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>retires</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>31</ipxact:bitOffset>
<ipxact:bitWidth>3</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>return_stack_size</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>34</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>sijump</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>38</ipxact:bitOffset>
<ipxact:bitWidth>1</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>taken_branches</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>39</ipxact:bitOffset>
<ipxact:bitWidth>4</ipxact:bitWidth>
</ipxact:field>
<ipxact:field>
<ipxact:name>impdef_width</ipxact:name>
<ipxact:description>text</ipxact:description>
<ipxact:bitOffset>43</ipxact:bitOffset>
<ipxact:bitWidth>5</ipxact:bitWidth>
</ipxact:field>
</ipxact:register>

</ipxact:addressBlock>
<ipxact:addressUnitBits>8</ipxact:addressUnitBits>
</ipxact:memoryMap>
</ipxact:memoryMaps>
</ipxact:component>
```
