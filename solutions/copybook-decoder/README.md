# Copybook Decoder

**Turn a mainframe file nobody can read into a spreadsheet, and its COBOL copybook into a data dictionary.**

Over 40% of banks still run COBOL core systems, and the people who understand them are retiring. Every migration,
regulatory request or data project hits the same wall: a fixed-length EBCDIC file full of packed numbers, and a
copybook that only a mainframe specialist can interpret.

Give the tool the copybook and (optionally) the data file:

- **Data dictionary:** every field with its level, start position, length, end, type (text, number with decimals,
  signed, packed, binary), 88-level values and redefinitions, as a readable table and a CSV for mapping work.
- **Decoded data:** EBCDIC (code page 037) or ASCII; zoned decimal (incl. overpunched signs), **packed decimal
  (COMP-3)**, binary (COMP/COMP-4/COMP-5), implied decimals (V), `SIGN LEADING/TRAILING SEPARATE`; OCCURS expanded as
  `NAME(1)`, `NAME(2)`…; REDEFINES laid out over the original field.
- **Problems flagged, never hidden:** invalid packed digits or sign nibbles, non-numeric data in numeric fields,
  negative signs on unsigned fields, and leftover bytes (wrong record length). Bad values are shown as raw hex.

Supports fixed-length records, variable-length records with RDW (`--rdw`) and newline-separated text files (`--lines`).

Runs locally. Your data never leaves your machine.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Decode*.

**Command line** (Node 22+):

```bash
node cli.ts --copybook samples/CUSTREC.cpy                                  # data dictionary only
node cli.ts --copybook samples/CUSTREC.cpy --data samples/CUSTMAST.dat --out out/
node cli.ts --copybook LAYOUT.cpy --data extract.txt --encoding ascii --lines
```

Tests: `node --test test/*.test.ts`

## How it's tested

The sample data file was written by a **separate encoder in Python** (its built-in cp037 codec plus hand-written packed
decimal and binary encoding), not by this tool. The test decodes all 40 records (440 field values: zoned, signed zoned,
COMP-3, binary, OCCURS, text) and requires an exact match. It also checks that a deliberately corrupted packed field is
reported as a problem rather than turned into a wrong number. Result: **440 / 440 exact**. Extra tests cover ASCII
overpunch, sign-separate, negative binary, group-level USAGE and OCCURS on groups.

## Limits

- One record layout per run (the first 01 level). Files mixing several record types need splitting first.
- `OCCURS DEPENDING ON` is laid out at its maximum size (warned).
- COMP-1/COMP-2 floating point isn't decoded (flagged). Code page 037 only for EBCDIC (common for US/UK/Canada; other
  national code pages differ for a few characters).
- Not a substitute for testing with the system owners.

Part of [Hyniqe Hub](../../README.md).
