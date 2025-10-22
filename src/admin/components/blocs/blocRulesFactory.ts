import { createTextRules, TextRule } from '../texts/textRulesFactory';
import { createImageRules, ImageRule } from '../images/imageRulesFactory';

export interface BlocRuleOptions {
  blocTitle: string;
  itemLabel: string;
  jsonKey: string;
  maxItem: number;
  minItem: number;
  textFields: Record<string, TextRule>;
  imageFields: Record<string, ImageRule>;
  isDuplicable?: boolean;
  startDateField?: string;
  endDateField?: string;
  rank?: number;
}

const defaultBlocRuleOptions: Omit<
  BlocRuleOptions,
  'blocTitle' | 'jsonKey' | 'textFields' | 'imageFields'
> = {
  itemLabel: 'Item',
  maxItem: 10,
  minItem: 1,
  isDuplicable: false,
  rank: 100,
};

export function createBlocRule(
  rule: {
    blocTitle: string;
    jsonKey: string;
  } & Partial<Omit<BlocRuleOptions, 'blocTitle' | 'jsonKey'>>,
): BlocRuleOptions {
  return {
    ...defaultBlocRuleOptions,
    ...rule,
    textFields: createTextRules(rule.textFields || {}),
    imageFields: createImageRules(rule.imageFields || {}),
    startDateField: rule.startDateField,
    endDateField: rule.endDateField,
    isDuplicable: rule.isDuplicable ?? false,
  };
}

export type BlocRule = ReturnType<typeof createBlocRule>;
export type BlocRuleMap = Record<string, BlocRule>;
