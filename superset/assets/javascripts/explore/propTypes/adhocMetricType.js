import PropTypes from 'prop-types';

import { AGGREGATES } from '../constants';
import columnType from './columnType';
import { EXPRESSION_TYPES }  from '../AdhocMetric';

export default PropTypes.oneOfType([
  PropTypes.shape({
    expressionType: PropTypes.oneOf(['SIMPLE']);
    column: columnType.isRequired,
    aggregate: PropTypes.oneOf(Object.keys(AGGREGATES)).isRequired,
    label: PropTypes.string.isRequired,
  }),
  PropTypes.shape({
    column: columnType.isRequired,
    aggregate: PropTypes.oneOf(Object.keys(AGGREGATES)).isRequired,
    label: PropTypes.string.isRequired,
  }),
]);
