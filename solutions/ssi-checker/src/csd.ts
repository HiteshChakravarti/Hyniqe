// Reference table of central securities depositories used as Place of Settlement (PSET).
// Covers the markets moving to T+1 on 11 October 2027 (EU, UK, Switzerland) plus the two ICSDs and the US.
// Verify against your market data provider before relying on it in production.

export interface Csd {
  bic: string;
  name: string;
  country: string;
}

export const CSDS: Csd[] = [
  { bic: 'MGTCBEBEECL', name: 'Euroclear Bank (ICSD)', country: 'BE' },
  { bic: 'CEDELULLXXX', name: 'Clearstream Banking Luxembourg (ICSD)', country: 'LU' },
  { bic: 'DAKVDEFFXXX', name: 'Clearstream Banking Frankfurt', country: 'DE' },
  { bic: 'SICVFRPPXXX', name: 'Euroclear France', country: 'FR' },
  { bic: 'NECINL2AXXX', name: 'Euroclear Nederland', country: 'NL' },
  { bic: 'CIKBBEBBXXX', name: 'Euroclear Belgium', country: 'BE' },
  { bic: 'CRSTGB22XXX', name: 'Euroclear UK & International', country: 'GB' },
  { bic: 'INSECHZZXXX', name: 'SIX SIS', country: 'CH' },
  { bic: 'MOTIITMMXXX', name: 'Euronext Securities Milan', country: 'IT' },
  { bic: 'IBRCESMMXXX', name: 'Iberclear', country: 'ES' },
  { bic: 'IBLSPTPPXXX', name: 'Euronext Securities Porto', country: 'PT' },
  { bic: 'VPDKDKKKXXX', name: 'Euronext Securities Copenhagen', country: 'DK' },
  { bic: 'VPSNNOKKXXX', name: 'Euronext Securities Oslo', country: 'NO' },
  { bic: 'VPCSSESSXXX', name: 'Euroclear Sweden', country: 'SE' },
  { bic: 'APKEFIHHXXX', name: 'Euroclear Finland', country: 'FI' },
  { bic: 'OCSDATWWXXX', name: 'OeKB CSD', country: 'AT' },
  { bic: 'KDPWPLPWXXX', name: 'KDPW', country: 'PL' },
  { bic: 'DTCYUS33XXX', name: 'Depository Trust Company', country: 'US' },
];

export const ICSD_BICS = new Set(['MGTCBEBEECL', 'CEDELULLXXX']);

export const CSD_BY_BIC: Record<string, Csd> = Object.fromEntries(CSDS.map((c) => [c.bic, c]));
