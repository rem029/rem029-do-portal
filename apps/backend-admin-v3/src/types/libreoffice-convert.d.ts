declare module 'libreoffice-convert' {
  function convert(
    buffer: Buffer,
    outputExtension: string,
    filter: string | undefined,
    callback: (err: Error | null, result: Buffer) => void,
  ): void

  export default { convert }
}
