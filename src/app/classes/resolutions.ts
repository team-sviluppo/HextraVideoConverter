export class VideoResolutionAspect {
  constructor(public w: number, public h: number) {

  }

  public GetFormatString(): string {
    return `${this.w}:${this.h}`;
  }
}

export class VideoResolution {
  constructor(public width: number, public height: number, public format: VideoResolutionAspect) {

  }

  public GetFormatString(): string {
    return `${this.width}x${this.height}`;
  }

  public setWidth(w: number) {
    let x;
    x = w * this.format.h / this.format.w;
    this.height = Math.round(x);
  };

  public setHeight(h: number) {
    let x;
    x = h * this.format.w / this.format.h;
    this.width = Math.round(x);
  };
}

export class VideoResolutionCollection {
  public collection: VideoResolution[] = [];

  constructor() { }

  public add(elem: VideoResolution) {
    this.collection.push(elem);
  }

  public remove(elem: VideoResolution) {
    this.collection.splice(this.collection.indexOf(elem), 1);
  }
}

export let DefaultAspects = [
  new VideoResolutionAspect(4,3),
  new VideoResolutionAspect(16,9),
  new VideoResolutionAspect(16,10)
];

export let DefaultVideoResolution = new VideoResolution(1280, 720, DefaultAspects.find((e) => e.GetFormatString() === "16:9"));
