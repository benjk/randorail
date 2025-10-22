import { BaseRule, LinkTo } from "../commons/BaseRule";

export interface TextRuleBase {
  key: string;
}

export type TextPatternType = 'text' | 'email' | 'url' | 'number' | 'phone';

export interface TextRuleOptions extends BaseRule {
  maxLength: number;
  minLength: number;
  lineBreakable?: boolean;
  maxLines?: number;
  textType?: TextPatternType;
  formatInfo?: string; // info sur le format alimenté seulement si textType,
}

export type TextRule = TextRuleBase & TextRuleOptions;

const defaultTextRuleOptions: Required<Omit<TextRuleOptions, 'linkTo'>> & {
  linkTo?: LinkTo;
} = {
  label: "Champ éditable",
  maxLength: 800,
  minLength: 0,
  lineBreakable: false,
  maxLines: 30,
  textType: 'text',
  isUnic: false,
  formatInfo: '',
  extraInfo: 'Ce texte est commun à plusieurs endroits du site.',
  rank: 0,
  isDuplicable: false,
  minItems: 1,
  maxItems: 1,
};

function createTextRule(rule: TextRule): TextRule {
  return {
    ...defaultTextRuleOptions,
    ...rule,
  };
}

export function createTextRules(
  rules: Record<string, TextRule>,
): Record<string, TextRule> {
  const result: Record<string, TextRule> = {};
  for (const key in rules) {
    result[key] = createTextRule(rules[key]);
  }
  return result;
}
