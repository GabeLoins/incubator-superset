import React from 'react';
import PropTypes from 'prop-types';

import MetricOption from '../../components/MetricOption';
import ColumnOption from '../../components/ColumnOption';
import ColumnTypeLabel from '../../components/ColumnTypeLabel';
import AdhocMetricStaticOption from './AdhocMetricStaticOption';
import AdhocMetric from '../AdhocMetric';
import columnType from '../propTypes/columnType';
import savedMetricType from '../propTypes/savedMetricType';
import adhocMetricType from '../propTypes/adhocMetricType';

const propTypes = {
  option: PropTypes.oneOfType([
    columnType,
    PropTypes.shape({ saved_metric_name: PropTypes.string.isRequired }),
    adhocMetricType,
  ]).isRequired,
};

export default function FilterDefinitionOption({ option }) {
  if (option.saved_metric_name) {
    return (
      <div>
        <ColumnTypeLabel type="expression" />
        <span className="m-r-5 option-label">
          {option.saved_metric_name}
        </span>
      </div>
    );
  } else if (option.column_name) {
    return (
      <ColumnOption column={option} showType />
    );
  } else if (option.label) {
    return (
      <AdhocMetricStaticOption adhocMetric={option} showType />
    );
  }
}
FilterDefinitionOption.propTypes = propTypes;
