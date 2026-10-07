declare module 'xlsx-populate' {
  interface XlsxPopulate {
    fromBlankAsync(): Promise<Workbook>
    fromDataAsync(data: ArrayBuffer | Buffer): Promise<Workbook>
  }

  interface Workbook {
    sheet(name: string | number): Sheet
    definedName(name: string): DefinedName
    outputAsync(): Promise<ArrayBuffer>
    find(pattern: string | RegExp, replacement?: string | ((match: string) => string)): Cell[]
    sheetCount(): number
  }

  interface Sheet {
    definedName(name: string): DefinedName
    find(pattern: string | RegExp, replacement?: string | ((match: string) => string)): Cell[]
    forEach(callback: (cell: Cell) => void): void
  }

  interface Cell {
    value(): any
    value(val: any): Cell
    find(pattern: string | RegExp): boolean
  }

  interface DefinedName {
    value(val?: any): any
  }

  const XlsxPopulate: XlsxPopulate
  export = XlsxPopulate
}
