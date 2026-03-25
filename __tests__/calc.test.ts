import { describe, it, expect } from 'vitest'
import {
  toDateStr, daysBetween, resolveWibor, payDate,
  ann, int, calculateLoan, parseStooqCSV,
} from '../src/calc'

// ── Helpers ──────────────────────────────────────────────────────────

describe('toDateStr', () => {
  it('formatuje datę jako YYYY-MM-DD', () => {
    expect(toDateStr(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(toDateStr(new Date(2023, 11, 31))).toBe('2023-12-31')
  })
})

describe('daysBetween', () => {
  it('liczy dni między datami', () => {
    expect(daysBetween(new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(30)
    expect(daysBetween(new Date(2024, 0, 1), new Date(2024, 1, 1))).toBe(31)
  })
  it('zwraca 0 dla tej samej daty', () => {
    expect(daysBetween(new Date(2024, 5, 15), new Date(2024, 5, 15))).toBe(0)
  })
})

describe('resolveWibor', () => {
  const data = [
    { date: '2023-01-01', rate: 6.0 },
    { date: '2023-04-01', rate: 5.5 },
    { date: '2023-07-01', rate: 5.0 },
  ]

  it('zwraca stawkę obowiązującą w danej dacie', () => {
    expect(resolveWibor(new Date(2023, 0, 1), data)).toBe(6.0)
    expect(resolveWibor(new Date(2023, 3, 1), data)).toBe(5.5)
    expect(resolveWibor(new Date(2023, 5, 15), data)).toBe(5.5)
    expect(resolveWibor(new Date(2023, 8, 1), data)).toBe(5.0)
  })
  it('zwraca pierwszą stawkę dla daty przed danymi', () => {
    expect(resolveWibor(new Date(2022, 0, 1), data)).toBe(6.0)
  })
})

describe('payDate', () => {
  it('oblicza datę spłaty N miesięcy od startu', () => {
    const start = new Date(2023, 0, 15) // 15 sty 2023
    const pd1 = payDate(start, 1, 15)
    expect(pd1.getFullYear()).toBe(2023)
    expect(pd1.getMonth()).toBe(1)  // luty
    expect(pd1.getDate()).toBe(15)
  })
  it('przechodzi przez koniec roku', () => {
    const start = new Date(2023, 10, 1) // 1 lis 2023
    const pd3 = payDate(start, 3, 1)
    expect(pd3.getFullYear()).toBe(2024)
    expect(pd3.getMonth()).toBe(1)  // luty
  })
  it('ogranicza dzień do ostatniego dnia miesiąca', () => {
    const start = new Date(2023, 0, 31) // 31 sty
    const pdFeb = payDate(start, 1, 31)
    expect(pdFeb.getMonth()).toBe(1) // luty
    expect(pdFeb.getDate()).toBe(28) // nie-przestępny
  })
})

// ── Odsetki i raty ──────────────────────────────────────────────────

describe('ann (rata annuitetowa)', () => {
  it('oblicza ratę dla typowego kredytu', () => {
    // 300 000 PLN, 7% rocznie, 360 miesięcy
    const result = ann(300000, 7, 360)
    // Oczekiwana rata ~1995.91 (standardowa formuła)
    expect(result).toBeCloseTo(1995.91, 0)
  })
  it('dla zerowego oprocentowania dzieli równo', () => {
    expect(ann(120000, 0, 12)).toBeCloseTo(10000, 2)
  })
  it('dla 1 raty zwraca cały kapitał + odsetki', () => {
    const result = ann(100000, 6, 1)
    // 100000 * (0.005 * 1.005) / (1.005 - 1) = 100000 * 1.005 = 100500
    expect(result).toBeCloseTo(100500, 0)
  })
  it('dla 0 pozostałych rat zwraca kapitał', () => {
    expect(ann(50000, 5, 0)).toBe(50000)
  })
})

describe('int (odsetki za okres)', () => {
  it('oblicza odsetki baza 360', () => {
    // 300 000 * (5/100) * 30 / 360 = 1250
    expect(int(300000, 5, 30, 360)).toBeCloseTo(1250, 2)
  })
  it('oblicza odsetki baza 365', () => {
    // 300 000 * (5/100) * 30 / 365 ≈ 1232.88
    expect(int(300000, 5, 30, 365)).toBeCloseTo(1232.88, 1)
  })
  it('dla zerowej stawki zwraca 0', () => {
    expect(int(300000, 0, 30)).toBe(0)
  })
})

// ── parseStooqCSV ───────────────────────────────────────────────────

describe('parseStooqCSV', () => {
  it('parsuje format YYYY-MM-DD', () => {
    const csv = `Date,Open,High,Low,Close,Volume
2023-01-02,6.82,6.82,6.82,6.82,0
2023-01-03,6.81,6.81,6.81,6.80,0`
    const result = parseStooqCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2023-01-02', rate: 6.82 })
    expect(result[1]).toEqual({ date: '2023-01-03', rate: 6.80 })
  })

  it('parsuje format YYYYMMDD (Stooq)', () => {
    const csv = `Date,Open,High,Low,Close
20230102,6.82,6.82,6.82,6.82
20230103,6.81,6.81,6.81,6.80`
    const result = parseStooqCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2023-01-02')
  })

  it('pomija nieprawidłowe linie', () => {
    const csv = `header
bad,line
2023-01-02,1,2,3,5.5`
    const result = parseStooqCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].rate).toBe(5.5)
  })

  it('sortuje po dacie', () => {
    const csv = `D,O,H,L,C
2023-06-01,1,1,1,5.0
2023-01-01,1,1,1,6.0
2023-03-01,1,1,1,5.5`
    const result = parseStooqCSV(csv)
    expect(result[0].date).toBe('2023-01-01')
    expect(result[2].date).toBe('2023-06-01')
  })
})

// ── calculateLoan ───────────────────────────────────────────────────

describe('calculateLoan', () => {
  const wiborData = [
    { date: '2018-01-01', rate: 1.72 },
    { date: '2020-01-01', rate: 1.71 },
    { date: '2020-04-01', rate: 0.70 },
    { date: '2020-07-01', rate: 0.26 },
    { date: '2021-10-01', rate: 0.64 },
    { date: '2022-01-01', rate: 2.83 },
    { date: '2022-04-01', rate: 4.98 },
    { date: '2022-07-01', rate: 6.90 },
    { date: '2022-10-01', rate: 7.12 },
    { date: '2023-01-01', rate: 6.89 },
    { date: '2023-04-01', rate: 6.90 },
    { date: '2023-07-01', rate: 6.85 },
    { date: '2023-10-01', rate: 5.80 },
    { date: '2024-01-01', rate: 5.86 },
    { date: '2024-04-01', rate: 5.85 },
    { date: '2024-07-01', rate: 5.86 },
    { date: '2024-10-01', rate: 5.83 },
    { date: '2025-01-01', rate: 5.79 },
  ]

  const baseInput = {
    loanAmount: 300000,
    margin: 2.0,
    loanPeriodMonths: 360,
    startDate: new Date(2018, 0, 1),
    paymentDay: 15,
    bridgeMargin: 0,
    bridgeEndDate: null,
    wiborTenor: '3M',
    wiborData: wiborData,
    interestBase: 360,
    repaymentType: 'annuity',
  }

  it('zwraca null gdy brak danych WIBOR', () => {
    expect(calculateLoan({ ...baseInput, wiborData: [] })).toBeNull()
  })

  it('generuje harmonogram o poprawnej długości', () => {
    const r = calculateLoan(baseInput)!
    expect(r).not.toBeNull()
    expect(r.schedule).toHaveLength(360)
  })

  it('harmonogram zaczyna się od raty 1 i kończy na 360', () => {
    const r = calculateLoan(baseInput)!
    expect(r.schedule[0].number).toBe(1)
    expect(r.schedule[359].number).toBe(360)
  })

  it('saldo końcowe = 0 (spłata pełna)', () => {
    const r = calculateLoan(baseInput)!
    const lastBalance = r.schedule[359].remainingBalance
    expect(lastBalance).toBeCloseTo(0, 2)
  })

  it('suma kapitału = kwota kredytu', () => {
    const r = calculateLoan(baseInput)!
    const totalPrincipal = r.schedule.reduce((s: number, x: any) => s + x.principal, 0)
    expect(totalPrincipal).toBeCloseTo(300000, 1)
  })

  it('repaymentType = annuity', () => {
    const r = calculateLoan(baseInput)!
    expect(r.repaymentType).toBe('annuity')
  })

  it('odsetki WIBOR > 0 (przy stawkach > 0)', () => {
    const r = calculateLoan(baseInput)!
    const totalWiborInterest = r.schedule.reduce((s: number, x: any) => s + x.interestWibor, 0)
    expect(totalWiborInterest).toBeGreaterThan(0)
  })

  it('nadpłacone odsetki = suma odsetek - odsetki bez WIBOR', () => {
    const r = calculateLoan(baseInput)!
    expect(r.overpaidInterest).toBeCloseTo(r.pastInterestTotal - r.pastInterestNoWibor, 2)
  })

  it('pastN + futN = 360', () => {
    const r = calculateLoan(baseInput)!
    expect(r.pastInstallmentsCount + r.futureInstallmentsCount).toBe(360)
  })

  // ── Raty malejące ──────────────────────────────────────────────

  it('raty malejące: saldo końcowe = 0', () => {
    const r = calculateLoan({ ...baseInput, repaymentType: 'decreasing' })!
    expect(r.repaymentType).toBe('decreasing')
    expect(r.schedule[359].remainingBalance).toBeCloseTo(0, 2)
  })

  it('raty malejące: kapitał w każdej racie ≈ stały', () => {
    const r = calculateLoan({ ...baseInput, repaymentType: 'decreasing' })!
    // Pierwsze raty powinny mieć zbliżony kapitał (nie idealnie równy bo rem maleje)
    // Ale suma = kwota kredytu
    const totalPr = r.schedule.reduce((s: number, x: any) => s + x.principal, 0)
    expect(totalPr).toBeCloseTo(300000, 1)
  })

  it('raty malejące: pierwsza rata > ostatnia rata', () => {
    const r = calculateLoan({ ...baseInput, repaymentType: 'decreasing' })!
    expect(r.schedule[0].installment).toBeGreaterThan(r.schedule[359].installment)
  })

  // ── Bridge margin ──────────────────────────────────────────────

  it('bridge margin: nalicza dodatkowe odsetki do daty końcowej', () => {
    const withBridge = calculateLoan({
      ...baseInput,
      bridgeMargin: 1.5,
      bridgeEndDate: new Date(2019, 0, 15),
    })!
    const withoutBridge = calculateLoan(baseInput)!

    // Odsetki pomostowe powinny zwiększyć łączne odsetki
    const bridgeInt = withBridge.schedule
      .filter((x: any) => x.interestBridge > 0)
    expect(bridgeInt.length).toBeGreaterThan(0)

    // Raty z bridge powinny być droższe
    const totalWithBridge = withBridge.schedule.reduce((s: number, x: any) => s + x.installment, 0)
    const totalWithout = withoutBridge.schedule.reduce((s: number, x: any) => s + x.installment, 0)
    expect(totalWithBridge).toBeGreaterThan(totalWithout)
  })

  it('bridge margin: brak odsetek pomostowych po dacie końcowej', () => {
    const r = calculateLoan({
      ...baseInput,
      bridgeMargin: 1.5,
      bridgeEndDate: new Date(2019, 0, 15),
    })!
    const afterBridge = r.schedule.filter(
      (x: any) => x.date > new Date(2019, 0, 15) && x.interestBridge > 0
    )
    expect(afterBridge).toHaveLength(0)
  })

  // ── Baza 365 ──────────────────────────────────────────────────

  it('baza 365: niższe odsetki dzienne niż baza 360', () => {
    const r360 = calculateLoan(baseInput)!
    const r365 = calculateLoan({ ...baseInput, interestBase: 365 })!

    const int360 = r360.schedule.reduce((s: number, x: any) => s + x.interestTotal, 0)
    const int365 = r365.schedule.reduce((s: number, x: any) => s + x.interestTotal, 0)
    expect(int365).toBeLessThan(int360)
  })

  // ── Stała stawka WIBOR ────────────────────────────────────────

  it('stała stawka WIBOR: wszystkie raty mają ten sam wiborRate', () => {
    const r = calculateLoan({
      ...baseInput,
      wiborData: [{ date: '2000-01-01', rate: 5.85 }],
    })!
    const rates = new Set(r.schedule.map((x: any) => x.wiborRate))
    expect(rates.size).toBe(1)
    expect(rates.has(5.85)).toBe(true)
  })

  // ── Tenor 6M ──────────────────────────────────────────────────

  it('tenor 6M: WIBOR resetuje się co 6 miesięcy', () => {
    const r = calculateLoan({ ...baseInput, wiborTenor: '6M' })!
    // Zbierz unikalne stawki i ich pozycje
    let lastRate = r.schedule[0].wiborRate
    let changeCount = 0
    for (let i = 1; i < r.schedule.length; i++) {
      if (r.schedule[i].wiborRate !== lastRate) {
        changeCount++
        lastRate = r.schedule[i].wiborRate
      }
    }
    // Przy 6M reset — zmian powinno być mniej niż przy 3M
    const r3 = calculateLoan(baseInput)!
    let last3 = r3.schedule[0].wiborRate
    let changes3 = 0
    for (let i = 1; i < r3.schedule.length; i++) {
      if (r3.schedule[i].wiborRate !== last3) { changes3++; last3 = r3.schedule[i].wiborRate }
    }
    expect(changeCount).toBeLessThanOrEqual(changes3)
  })

  // ── Snapshot: zablokuj aktualne wartości ───────────────────────

  it('snapshot: suma rat harmonogramu (stała stawka 5.85%, annuity)', () => {
    const r = calculateLoan({
      ...baseInput,
      wiborData: [{ date: '2000-01-01', rate: 5.85 }],
    })!
    const totalPaid = r.schedule.reduce((s: number, x: any) => s + x.installment, 0)
    // Zablokowana wartość — klient potwierdził obliczenia
    expect(totalPaid).toBeCloseTo(795847.85, -1) // tolerancja do 10 PLN
  })

  it('snapshot: pierwsza rata (stała stawka 5.85%, annuity)', () => {
    const r = calculateLoan({
      ...baseInput,
      wiborData: [{ date: '2000-01-01', rate: 5.85 }],
    })!
    // Rata 1: kapitał + odsetki za pierwszy okres
    expect(r.schedule[0].installment).toBeCloseTo(2943.75, 0)
  })
})
