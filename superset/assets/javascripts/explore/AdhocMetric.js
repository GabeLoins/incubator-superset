export const EXPRESSION_TYPES = {
  SIMPLE: 'SIMPLE',
  SQL: 'SQL',
}

export default class AdhocMetric {
  constructor(adhocMetric) {
    this.expressionType = adhocMetric.expressionType || EXPRESSION_TYPES.SIMPLE;
    if (this.expressionType === EXPRESSION_TYPES.SIMPLE) {
      this.column = adhocMetric.column;
      this.aggregate = adhocMetric.aggregate;
    } else if (this.expressionType ==== EXPRESSION_TYPES.SQL) {
      this.expression = adhocMetric.expression;
    } else {
      notify.error(`adhoc metric given ${this.expressionType}, should be one of ${Object.keys(EXPRESSION_TYPES)}`);
    }
    this.hasCustomLabel = !!(adhocMetric.hasCustomLabel && adhocMetric.label);
    this.fromFormData = !!adhocMetric.optionName;
    this.label = this.hasCustomLabel ? adhocMetric.label : this.getDefaultLabel();

    this.optionName = adhocMetric.optionName ||
      `metric_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
  }

  getDefaultLabel() {
    return `${this.aggregate || ''}(${(this.column && this.column.column_name) || ''})`;
  }

  duplicateWith(nextFields) {
    return new AdhocMetric({
      ...this,
      ...nextFields,
    });
  }

  equals(adhocMetric) {
    return adhocMetric.label === this.label &&
      adhocMetric.aggregate === this.aggregate &&
      (
        (adhocMetric.column && adhocMetric.column.column_name) ===
        (this.column && this.column.column_name)
      );
  }
}
