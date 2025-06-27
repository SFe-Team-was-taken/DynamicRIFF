# Dynamic RIFF specification

# Version 1.0.2 (Draft specification) - June 2025

Copyright © 2025 SFe Team and contributors.
Copyright © 2025 Spessasus.

Designed and written by Spessasus - brought to life by the SFe Team.

## 0.1. Revision history

|          |                    |                                                                  |
|----------|--------------------|------------------------------------------------------------------|
| Revision | Date               | Description                                                      |
| 1.0.1    | 9 February 2025    | First version                                                    |
| 1.0.2    | 21 June 2025       | Major format revision                                            |

* * *

## 0.2. Disclaimers

This is not currently part of the core SFe specification, but is planned for future integration.

This is a draft. Expect errors, and feel free to report them.

Do not use "draft" specifications (version number x.y.zL) to base final products on. Always refer to a "final" specification (version number x.yL).

## 0.3. Updates and comments

Please send all comments about this specification to the SFe Team:

- GitHub: https://github.com/SFe-Team-was-taken/DynamicRIFF

* * *

## 0.4. Table of contents

<!-- TOC -->
* [Dynamic RIFF specification](#dynamic-riff-specification)
* [Version 1.0.2 (Draft specification) - June 2025](#version-102-draft-specification---june-2025)
  * [0.1. Revision history](#01-revision-history)
  * [0.2. Disclaimers](#02-disclaimers)
  * [0.3. Updates and comments](#03-updates-and-comments)
  * [0.4. Table of contents](#04-table-of-contents)
* [Section 1: Introduction](#section-1-introduction)
  * [1.1. RIFF format limitations](#11-riff-format-limitations)
  * [1.2. What is the Dynamic RIFF?](#12-what-is-the-dynamic-riff)
  * [1.3. Design goals](#13-design-goals)
* [Section 2: The Dynamic RIFF chunk](#section-2-the-dynamic-riff-chunk)
  * [2.1. Definitions](#21-definitions)
    * [2.1.1. Variable-Length Quantity](#211-variable-length-quantity)
    * [2.1.2. Length-Prefixed String](#212-length-prefixed-string)
  * [2.2. RIFF header comparison](#22-riff-header-comparison)
    * [2.2.1. Original RIFF header](#221-original-riff-header)
    * [2.2.2. Dynamic RIFF Header](#222-dynamic-riff-header)
  * [2.3. Dynamic RIFF chunk behavior](#23-dynamic-riff-chunk-behavior)
    * [2.3.1. Byte alignment](#231-byte-alignment)
    * [2.3.2 Defined chunk types](#232-defined-chunk-types)
    * [2.3.3. General structure](#233-general-structure)
    * [2.3.4. Example file structure (simplified)](#234-example-file-structure-simplified)
  * [2.4. Reference implementation](#24-reference-implementation)
<!-- TOC -->

# Section 1: Introduction

## 1.1. RIFF format limitations

The original RIFF format excels in many aspects of creating an expandable and future-proof file format. 

Its tree-like structure, along with consistent chunk headers,
 allows older revisions of the software to ignore unknown chunks, 
ensuring backwards compatibility.
 
However, it has two major problems on modern platforms:
- 32-bit chunk size: Files are limited to 4GB in size.
- static header size: Headers can only be four characters long, making complex tree structures difficult to describe with just four letters.

## 1.2. What is the Dynamic RIFF?

Dynamic RIFF is a redesigned RIFF-compatible format that directly addresses both limitations.
By using dynamic chunk headers, both problems are solved.

Dynamic RIFF requires new parser implementations and cannot be parsed with the existing RIFF logic,
 as its header does not have a fixed size.

## 1.3. Design goals

The Dynamic RIFF format is designed to be:
 - similar to the old RIFF format, making it a format evolution that retains conceptual similarity to RIFF, 
easing transition for existing software architectures.
 - flexible, similar to formats like JSON.
 - descriptive and easy-to-read with generic Dynamic RIFF exploration software.
 - still allowing chunks to contain raw binary data instead of just text or numbers.

# Section 2: The Dynamic RIFF chunk

## 2.1. Definitions

Dynamic RIFF defines two new types of data:

### 2.1.1. Variable-Length Quantity

From [Wikipedia's article](https://en.wikipedia.org/wiki/Variable-length_quantity):
> A variable-length quantity (VLQ) is a universal code that uses an arbitrary number of binary octets (eight-bit bytes) 
> to represent an arbitrarily large integer.

This definition remains _unchanged_ in the Dynamic RIFF format and behaves exactly like the VLQ used in MIDI files.
That is:

> The encoding assumes an octet (an 8-bit byte) where the most significant bit (MSB),
> also commonly known as the sign bit, 
> is reserved to indicate whether another VLQ octet follows. 
> The VLQ octets are arranged most significant first in a stream. 

### 2.1.2. Length-Prefixed String

Length-Prefixed String, or LPString for short, is an ASCII string of variable length.
The first byte is the byte length of this string, excluding the byte itself:

```c
typedef struct {
   BYTE lpSize;
   CHAR lpChars[lpSize];
} LPString;
```

Being ASCII-only, each character is one byte, making the byte length equal to the character count.

This design ensures fast parsing of the string while extending its limit to 255 characters,
which is more than enough for chunk names.

The string is not terminated with a null byte.
 
Example:

```
0A -> 10 characters in length
54 -> 'T'
65 -> 'e'
78 -> 'x'
74 -> 't'
20 -> ' ' (space)
43 -> 'C'
68 -> 'h'
75 -> 'u'
6E -> 'n'
6B -> 'k'
```
This string is: `Text Chunk`

## 2.2. RIFF header comparison

### 2.2.1. Original RIFF header
```c
typedef struct {
   DWORD cdID;            // A chunk ID identifies the type of data within the chunk.
   DWORD ckSize;          // The size of the chunk data in bytes, excluding any pad byte.
   BYTE  ckDATA[ckSize];  // The actual data plus a pad byte if req’d to word align.
} RiffChunk;
```

- `fourCC` - the four-letter character code, identifier of the chunk.
- `ckSize` - chunk size, in bytes.
- `data` - the chunk's data.

### 2.2.2. Dynamic RIFF Header
The new chunk still consists of three elements:

```c
struct {
    LPString ckName;             // A chunk name describes what this chunk is.
    BYTE     ckType;             // An enum that describes a special chunk type.
    VLQ      ckSize;             // The size of the chunk data in bytes, excluding any pad byte.
    BYTE     ckData[ckSize];     // The actual data plus a pad byte if req’d to word align.
} DynamicRiff;
```


- `ckName` - the chunk's name, stored as an LPString.
- `ckType` - byte describing the inner contents of this chunk, allowing any DRIF supporting software to parse it.
It is one of the predefined values.
- `ckSize` - chunk size stored using Variable-Length Quantity, in bytes.
_This excludes the length of ckType, ckName and ckSize, as well as any pad bytes._
- `ckData` - the chunk's data.

`ckName` _cannot_ contain any non-printable characters, including line breaks.

## 2.3. Dynamic RIFF chunk behavior

### 2.3.1. Byte alignment

If the total chunk size `(length(ckName) + length(ckSize) + 1 (for ckType) + ckSize)` is not even, a pad byte of zero must be written at the end.
Padding bytes are _never_ included in `ckSize` and must be skipped over by the parser.

### 2.3.2 Defined chunk types

There are currently five defined primitive chunk types, describing their data structure.
- `0` - Binary type: a chunk with unspecified binary data.
- `1` - List type: a chunk that contains one or more Dynamic RIFF chunk in its contents. 
No other data is allowed in this type of chunk.
- `2` - Numeric type: a number stored as Variable-Length Quantity.
- `3` - UTF-8 type: a chunk that contains a UTF-8 encoded string of any length.
- `4` - ASCII type: a chunk that contains an ASCII encoded string of any length.
It should be used instead of ASCII when it's known that the chunk won't contain special characters,
to allow more basic string readers to parse it.

This design allows the software to understand the structure of an unknown chunk name.
For example, in a metadata list, all text chunks can be displayed as the metadata, even if a specific chunk name is not known.

If none of the types fit the purpose of this chunk, the binary type shall be used.

The List type can contain nested Dynamic RIFF chunks, and it cannot mix any binary data with them.
Binary is allowed to mix the binary data, however, it is highly recommended to avoid mixing them and using only the List type for nesting.

It is recommended to use the text and numeric types with the List type to create a list of key-value pairs.

Note that the text types _do not_ use the LPString as their length is known.

### 2.3.3. General structure

The whole file is _required_ to be encased in a singular top-level chunk named `DRIF` classified as a binary type.

The fourCC `DRIF` string tells a software supporting both RIFF 
and Dynamic RIFF that the following file uses the Dynamic RIFF file format, 
hence the requirement of the top level chunk to have this type.

The `DRIF`'s chunk data begins with an LPString describing the file type, to help identify the file.

### 2.3.4. Example file structure (simplified)

Please note that this file structure only serves as an example for showing the chunk naming,
and does not represent the SFe format structure in any way.

Note: Chunk type and name are merged for clarity: `<type> -> <name>`

- `Binary -> DRIF`
    - `SFe Bank` LPString 
    - `List -> Information`
      - `UTF8 -> Name`
        - `A test soundbank with unicode characters: ←↓→`
      - `UTF8 -> Description`
        - `This bank demonstrates the Dynamic RIFF file structure.\nIncluding line breaks.`
      - `Number -> Unix Time Creation Date`
        - `1750542505177`
      - `UTF8 -> Author`
        - `SFe Team`
      - `UTF8 -> Copyright`
        - `Copyright © SFe Team 2025`
      - `Binary -> Default Modulators`
        - `<binary DMOD data>`
    - `List -> Sample Data`
      - `List -> Sample`
        - `List -> Information`
          - `UTF8 -> Name`
            - `Piano C4`
          - `UTF8 -> Description`
            - `Sampled from Steinway D`
          - `Number -> MIDI Key`
            - `60`
          - `Number -> Pitch Correction`
            - `20`
        - `Binary -> Data`
          - `RIFF:WAVE` (WAV sample file)


## 2.4. Reference implementation

The reference implementation can be found in the [reference folder](reference).
