export enum FaceShape {
  OVAL = 'Oval',
  ROUND = 'Round',
  SQUARE = 'Square',
  HEART = 'Heart',
  TRIANGLE = 'Triangle',
  LONG = 'Long',
  DIAMOND = 'Diamond',
  UNKNOWN = 'Unknown'
}

export interface PoseSuggestion {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Pro';
  bestAngle: string;
  tags: string[];
}

export interface AnalysisResult {
  faceShape: FaceShape;
  reasoning: string;
  bestLighting: string;
  poseSuggestions: PoseSuggestion[];
}

export interface TrendingPose {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
}

export enum AppView {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  ANALYSIS = 'ANALYSIS',
  TRENDING = 'TRENDING',
  LIBRARY = 'LIBRARY'
}