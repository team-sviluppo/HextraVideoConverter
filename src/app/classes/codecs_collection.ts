import { Codec } from './codec';
import * as OS from 'os';

//ffprobe.exe -formats
// https://gist.github.com/RangelReale/3e6392289d8ba1a52b6e70cdd7e10282


/**
 * sample output:
 *
Codecs:
 D..... = Decoding supported
 .E.... = Encoding supported
 ..V... = Video codec
 ..A... = Audio codec
 ..S... = Subtitle codec
 ...I.. = Intra frame-only codec
 ....L. = Lossy compression
 .....S = Lossless compression
 -------
 D.VI.. 012v                 Uncompressed 4:2:2 10-bit
 *
 *
 */
export class CodecsCollection {
  public List: Codec[] = [];

  /**
   * Creates an instance of CodecsCollection.
   * @param {string} stdout : stdout line from terminal command ffmpeg -codecs
   * @memberof CodecsCollection
   */
  constructor(stdout: string) {
    const EOL = OS.EOL;
    let relevant_portion = stdout.split("-------"+EOL);
    let ELEMZ = relevant_portion[1].split(EOL);
    ELEMZ.forEach((e: string) => {
      this.List.push(new Codec(e));
    });
    console.log(this.List);
  }

  /**
   * Returns the codec specified by the user query (lambda expression);
   *
   * @param {(codec: Codec) => boolean} q
   * @returns {Codec}
   * @memberof CodecsCollection
   */
  public findByQuery(q: (codec: Codec) => boolean): Codec {
    return this.List.find(q);
  }

  /**
   * Returns an array of codec filtered according to the user's input query (lambda expression).
   *
   * @param {(codec: Codec) => boolean} q
   * @returns {Codec[]}
   * @memberof CodecsCollection
   */
  public getByQuery(q: (codec: Codec) => boolean): Codec[] {
    return this.List.filter(q);
  }

  /**
   * Returns an array containing audio codecs only.
   *
   * @returns {Codec[]}
   * @memberof CodecsCollection
   */
  public getAudioCodecs(): Codec[] {
    return this.List.filter(codec => codec.isAudio);
  }

  /**
   * Returns an array containing video codecs only.
   *
   * @returns {Codec[]}
   * @memberof CodecsCollection
   */
  public getVideoCodecs(): Codec[] {
    return this.List.filter(codec => codec.isVideo);
  }
}
