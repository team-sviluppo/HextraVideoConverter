export interface ICodec {
  isDecodingSupported: boolean,
  isEncodingSupported: boolean,
  isVideo: boolean,
  isAudio: boolean,
  isSubtitle: boolean,
  isIntraFrameOnlyCodec: boolean,
  isLossyCompression: boolean,
  isLossLessCompression: boolean,
  codecName: string,
  codecDescription: string
}

export class Codec implements ICodec {
  public isDecodingSupported: boolean;
  public isEncodingSupported: boolean;
  public isVideo: boolean;
  public isAudio: boolean;
  public isSubtitle: boolean;
  public isIntraFrameOnlyCodec: boolean;
  public isLossyCompression: boolean;
  public isLossLessCompression: boolean;
  public codecName: string;
  public codecDescription: string;

  /**
   * Creates an instance of Codec.
   *                                                   ---- fucking trailing space.
   *                                                  |
   *                                                  |
   *                                                  |
   * @param {string} consoleOutputString : sample -->  V..... a64multi             Multicolor charset for Commodore 64 (codec a64_multi)
   * @memberof Codec
   */
  constructor(consoleOutputString: string) {
    this.isDecodingSupported = consoleOutputString[1] === "D";
    this.isEncodingSupported = consoleOutputString[2] === "E";
    this.isVideo = consoleOutputString[3] === "V";
    this.isAudio = consoleOutputString[3] === "A";
    this.isSubtitle = consoleOutputString[3] === "S";
    this.isIntraFrameOnlyCodec = consoleOutputString[4] === "I";
    this.isLossyCompression = consoleOutputString[5] === "L";
    this.isLossLessCompression = consoleOutputString[6] === "S";

    let _name_portion = consoleOutputString.substring(8, 29);
    let _desc_portion = consoleOutputString.substring(29, consoleOutputString.length);

    this.codecName = _name_portion.trim();
    this.codecDescription = _desc_portion.trim();
  }
}
