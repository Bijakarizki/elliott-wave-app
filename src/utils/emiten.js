/**
 * IDX Emiten Database
 * Grouped by sector for easy browsing
 */

export const SECTORS = [
  {
    id: 'perbankan',
    label: 'Perbankan',
    icon: '🏦',
    stocks: [
      { ticker: 'BBCA', name: 'Bank Central Asia' },
      { ticker: 'BBRI', name: 'Bank Rakyat Indonesia' },
      { ticker: 'BMRI', name: 'Bank Mandiri' },
      { ticker: 'BBNI', name: 'Bank Negara Indonesia' },
      { ticker: 'BRIS', name: 'Bank Syariah Indonesia' },
      { ticker: 'BNGA', name: 'Bank CIMB Niaga' },
      { ticker: 'BTPS', name: 'Bank BTPN Syariah' },
      { ticker: 'ARTO', name: 'Bank Jago' },
      { ticker: 'AGRO', name: 'Bank Raya Indonesia' },
      { ticker: 'PNBN', name: 'Bank Pan Indonesia' },
    ],
  },
  {
    id: 'telko',
    label: 'Telekomunikasi',
    icon: '📡',
    stocks: [
      { ticker: 'TLKM', name: 'Telkom Indonesia' },
      { ticker: 'EXCL', name: 'XL Axiata' },
      { ticker: 'ISAT', name: 'Indosat Ooredoo Hutchison' },
      { ticker: 'FREN', name: 'Smartfren Telecom' },
    ],
  },
  {
    id: 'energi',
    label: 'Energi & Tambang',
    icon: '⛏️',
    stocks: [
      { ticker: 'BYAN', name: 'Bayan Resources' },
      { ticker: 'ADRO', name: 'Alamtri Resources' },
      { ticker: 'PTBA', name: 'Bukit Asam' },
      { ticker: 'ITMG', name: 'Indo Tambangraya Megah' },
      { ticker: 'HRUM', name: 'Harum Energy' },
      { ticker: 'MDKA', name: 'Merdeka Copper Gold' },
      { ticker: 'ANTM', name: 'Aneka Tambang' },
      { ticker: 'MEDC', name: 'Medco Energi' },
      { ticker: 'ELSA', name: 'Elnusa' },
    ],
  },
  {
    id: 'konsumer',
    label: 'Konsumer',
    icon: '🛒',
    stocks: [
      { ticker: 'UNVR', name: 'Unilever Indonesia' },
      { ticker: 'ICBP', name: 'Indofood CBP' },
      { ticker: 'INDF', name: 'Indofood Sukses Makmur' },
      { ticker: 'MYOR', name: 'Mayora Indah' },
      { ticker: 'SIDO', name: 'Industri Jamu Sido Muncul' },
      { ticker: 'ULTJ', name: 'Ultra Jaya Milk' },
      { ticker: 'KLBF', name: 'Kalbe Farma' },
      { ticker: 'KAEF', name: 'Kimia Farma' },
      { ticker: 'PYFA', name: 'Pyridam Farma' },
    ],
  },
  {
    id: 'properti',
    label: 'Properti',
    icon: '🏢',
    stocks: [
      { ticker: 'BSDE', name: 'Bumi Serpong Damai' },
      { ticker: 'CTRA', name: 'Ciputra Development' },
      { ticker: 'PWON', name: 'Pakuwon Jati' },
      { ticker: 'SMRA', name: 'Summarecon Agung' },
      { ticker: 'DMAS', name: 'Puradelta Lestari' },
    ],
  },
  {
    id: 'infrastruktur',
    label: 'Infrastruktur',
    icon: '🏗️',
    stocks: [
      { ticker: 'JSMR', name: 'Jasa Marga' },
      { ticker: 'WIKA', name: 'Wijaya Karya' },
      { ticker: 'WSKT', name: 'Waskita Karya' },
      { ticker: 'PTPP', name: 'PP Persero' },
      { ticker: 'ADHI', name: 'Adhi Karya' },
    ],
  },
  {
    id: 'teknologi',
    label: 'Teknologi',
    icon: '💻',
    stocks: [
      { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia' },
      { ticker: 'BUKA', name: 'Bukalapak' },
      { ticker: 'DMMX', name: 'Digital Mediatama Maxima' },
      { ticker: 'MTDL', name: 'Metrodata Electronics' },
    ],
  },
  {
    id: 'otomotif',
    label: 'Otomotif & Industri',
    icon: '🚗',
    stocks: [
      { ticker: 'ASII', name: 'Astra International' },
      { ticker: 'AUTO', name: 'Astra Otoparts' },
      { ticker: 'SMSM', name: 'Selamat Sempurna' },
      { ticker: 'INDS', name: 'Indospring' },
    ],
  },
  {
    id: 'rokok',
    label: 'Rokok & Agribisnis',
    icon: '🌿',
    stocks: [
      { ticker: 'HMSP', name: 'HM Sampoerna' },
      { ticker: 'GGRM', name: 'Gudang Garam' },
      { ticker: 'WIIM', name: 'Wismilak Inti Makmur' },
      { ticker: 'AALI', name: 'Astra Agro Lestari' },
      { ticker: 'LSIP', name: 'PP London Sumatra' },
      { ticker: 'DSNG', name: 'Dharma Satya Nusantara' },
    ],
  },
  {
    id: 'lq45',
    label: 'LQ45 Populer',
    icon: '⭐',
    stocks: [
      { ticker: 'BBCA', name: 'Bank Central Asia' },
      { ticker: 'BBRI', name: 'Bank Rakyat Indonesia' },
      { ticker: 'BMRI', name: 'Bank Mandiri' },
      { ticker: 'TLKM', name: 'Telkom Indonesia' },
      { ticker: 'ASII', name: 'Astra International' },
      { ticker: 'UNVR', name: 'Unilever Indonesia' },
      { ticker: 'BYAN', name: 'Bayan Resources' },
      { ticker: 'MDKA', name: 'Merdeka Copper Gold' },
      { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia' },
      { ticker: 'BUKA', name: 'Bukalapak' },
    ],
  },
]

export function searchStocks(query) {
  if (!query || query.length < 1) return []
  const q = query.toUpperCase()
  const results = []
  const seen = new Set()

  for (const sector of SECTORS) {
    for (const stock of sector.stocks) {
      if (seen.has(stock.ticker)) continue
      if (stock.ticker.includes(q) || stock.name.toUpperCase().includes(q)) {
        results.push({ ...stock, sector: sector.label, sectorIcon: sector.icon })
        seen.add(stock.ticker)
      }
    }
  }

  return results.slice(0, 10)
}

export function getStockInfo(ticker) {
  const t = ticker.toUpperCase().replace('.JK', '')
  for (const sector of SECTORS) {
    const found = sector.stocks.find(s => s.ticker === t)
    if (found) return { ...found, sector: sector.label, sectorIcon: sector.icon }
  }
  return null
}
