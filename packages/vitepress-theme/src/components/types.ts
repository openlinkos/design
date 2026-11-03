// The data the data-driven landing components take.

/** One step of OlSteps. */
export interface OlStep {
  /** The step's heading, one line. */
  title: string;
  /** What happens in this step, one or two sentences. */
  text?: string;
  /** A screenshot or an output shown beside the step. */
  media?: string;
  /** What the media shows; empty when it only decorates. */
  alt?: string;
}

/** One name in OlLogos. */
export interface OlLogo {
  /** The name, always shown to screen readers and when there is no image. */
  name: string;
  /** The logo, an image that reads on both a light and a dark page. */
  src?: string;
  /** Where the name goes, if anywhere. */
  href?: string;
}
