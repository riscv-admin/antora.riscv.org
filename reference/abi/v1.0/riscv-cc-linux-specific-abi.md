# Linux-specific ABI

## [](#linux-specific-abi)Appendix A: Linux-specific ABI

| |  This section of the RISC-V calling convention specification only applies to Linux-based systems. |
| --------------------------------------------------------------------------------------------------- |

In order to ensure compatibility between different implementations of the C library for Linux, we provide some extra definitions which only apply on those systems. These are noted in this section.

### [](#linux-specific-c-type-sizes-and-alignments)Linux-specific C type sizes and alignments

The following definitions apply for all ABIs defined in this document. Here there is no differentiation between ILP32 and LP64 ABIs.

__Table 1\. Linux-specific C type sizes and alignments__
| Type     | Size (Bytes) | Alignment (Bytes) |
| -------- | ------------ | ----------------- |
| wchar\_t | 4            | 4                 |
| wint\_t  | 4            | 4                 |

### [](#linux-specific-c-type-representations)Linux-specific C type representations

The following definitions apply for all ABIs defined in this document. Here there is no differentiation between ILP32 and LP64 ABIs.

`wchar_t` is signed. `wint_t` is unsigned.
