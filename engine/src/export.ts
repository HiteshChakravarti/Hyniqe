// Structured-address export: one row per vendor, ready to load back into the ERP.
import type { Engine } from './engine.ts';
import { allRecords, toCsv } from './records.ts';

export function structuredCsv(engine: Engine): string {
  return toCsv(
    allRecords(engine).map((r) => ({
      vendor_id: r.source_id, name: r.name, status: r.status, method: r.method ?? '', confidence: r.confidence ?? '',
      original: r.source.address_text || [r.source.building, r.source.street, r.source.postcode, r.source.town, r.source.country].filter(Boolean).join(' | '),
      StrtNm: r.address?.StrtNm ?? '', BldgNb: r.address?.BldgNb ?? '', BldgNm: r.address?.BldgNm ?? '', Flr: r.address?.Flr ?? '',
      Room: r.address?.Room ?? '', PstBx: r.address?.PstBx ?? '', PstCd: r.address?.PstCd ?? '', TwnNm: r.address?.TwnNm ?? '',
      CtrySubDvsn: r.address?.CtrySubDvsn ?? '', Ctry: r.address?.Ctry ?? '', AdrLine: (r.address?.AdrLine ?? []).join(' / '),
      resolved_by: r.resolved_by ?? '',
    })),
  );
}
