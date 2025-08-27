export type Rect = { x: number; y: number; width: number; height: number }; // normalized [0,1]

export interface RecognizedTextBlock {
  text: string;
  confidence: number;
  boundingBox: Rect;
}

export type RecognizedText = RecognizedTextBlock[];
