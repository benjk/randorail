export interface LinkTo {
  route: string;
  selector: string;
}

export interface BaseRule {
  label: string;
  isUnic?: boolean;
  linkTo?: {
    selector: string;
    route: string;
  };
  extraInfo?: string;
  rank?: number;
  isDuplicable?: boolean;
  minItems?: number;
  maxItems?: number; // Pertienent uniquement si isDuplicable
}
