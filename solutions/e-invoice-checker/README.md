# E-invoice Viewer & Checker

Open any EN 16931 e-invoice as a readable invoice and see, in plain English, every rule it breaks.

```bash
npm run einvoice -- invoice.xml
npm run einvoice -- factur-x.pdf
```

Reads UBL 2.1 invoices and credit notes (Peppol BIS Billing 3.0, XRechnung UBL), UN/CEFACT CII (XRechnung CII, Factur-X, ZUGFeRD) and the XML embedded in Factur-X / ZUGFeRD PDFs.

Checks the EN 16931 business rules behind most rejections: mandatory fields, all document totals (BR-CO-10 to BR-CO-16), VAT breakdown and calculation per rate (BR-S-08, BR-S-09), exemption reasons, VAT number prefixes, due date or payment terms, and the payee account, plus the Peppol buyer-reference and electronic-address rules and the XRechnung Leitweg-ID rule. Each rule is listed with its ID and source in `src/rules.ts`.

This is a fast first check that explains problems; your access point's full schema and Schematron validation remains the final word.
