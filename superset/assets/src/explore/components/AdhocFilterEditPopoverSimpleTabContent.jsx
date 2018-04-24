import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Tab } from 'react-bootstrap';

import AdhocFilter, { EXPRESSION_TYPES, CLAUSES } from '../AdhocFilter';
import adhocMetricType from '../propTypes/adhocMetricType';
import columnType from '../propTypes/columnType';
import { t } from '../../locales';
import {
  OPERATORS,
  TABLE_ONLY_OPERATORS,
  DRUID_ONLY_OPERATORS,
  HAVING_OPERATORS,
  MULTI_OPERATORS,
} from '../constants';
import FilterDefinitionOption from './FilterDefinitionOption';
import OnPasteSelect from '../../components/OnPasteSelect';
import SelectControl from './controls/SelectControl';
import VirtualizedRendererWrap from '../../components/VirtualizedRendererWrap';
import VirtualizedSelect from 'react-virtualized-select';

const $ = window.$ = require('jquery');

const propTypes = {
  adhocFilter: PropTypes.instanceOf(AdhocFilter).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    columnType,
    PropTypes.shape({ saved_metric_name: PropTypes.string.isRequired }),
    adhocMetricType,
  ])).isRequired,
  datasource: PropTypes.object,
};

const defaultProps = {
  datasource: {},
};

export default class AdhocFilterEditPopoverSimpleTabContent extends React.Component {
  constructor(props) {
    super(props);
    this.onSubjectChange = this.onSubjectChange.bind(this);
    this.onOperatorChange = this.onOperatorChange.bind(this);
    this.onComparatorChange = this.onComparatorChange.bind(this);
    this.onInputComparatorChange = this.onInputComparatorChange.bind(this);
    this.isOperatorRelevant = this.isOperatorRelevant.bind(this);
    this.refreshComparatorSuggestions = this.refreshComparatorSuggestions.bind(this);

    this.state = {
      suggestions: [],
    };

    this.selectProps = {
      multi: false,
      name: 'select-column',
      labelKey: 'label',
      autosize: false,
      clearable: false,
      selectWrap: VirtualizedSelect,
    };
  }

  componentWillMount() {
    this.refreshComparatorSuggestions();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.adhocFilter.subject !== this.props.adhocFilter.subject) {
      this.refreshComparatorSuggestions();
    }
  }

  refreshComparatorSuggestions() {
    const datasource = this.props.datasource;
    const col = this.props.adhocFilter.subject;
    const having = this.props.adhocFilter.clause === CLAUSES.HAVING;

    if (col && datasource && datasource.filter_select && !having) {
      if (this.state.activeRequest) {
        this.state.activeRequest.abort();
      }
      this.setState({
        activeRequest: $.ajax({
          type: 'GET',
          url: `/superset/filter/${datasource.type}/${datasource.id}/${col}/`,
          success: data => { this.setState({ suggestions: data, activeRequest: null }) },
        }),
      });
    }
  }

  onSubjectChange(option) {
    let subject;
    let clause;
    // infer the new clause based on what subject was selected.
    if (option && option.column_name) {
      subject = option.column_name;
      clause = CLAUSES.WHERE;
    } else if (option && (option.saved_metric_name || option.label)) {
      subject = option.saved_metric_name || option.label;
      clause = CLAUSES.HAVING;
    }
    this.props.onChange(this.props.adhocFilter.duplicateWith({
      subject,
      clause,
      expressionType: EXPRESSION_TYPES.SIMPLE,
    }));
  }

  onOperatorChange(operator) {
    const currentComparator = this.props.adhocFilter.comparator;
    let newComparator;
    // convert between list of comparators and individual comparators
    // (e.g. `in ('North America', 'Africa')` to `== 'North America'`)
    if (MULTI_OPERATORS.indexOf(operator.operator) >= 0) {
      newComparator = Array.isArray(currentComparator) ?
        currentComparator :
        [currentComparator].filter(element => element);
    } else {
      newComparator = Array.isArray(currentComparator) ? currentComparator[0] : currentComparator;
    }
    this.props.onChange(this.props.adhocFilter.duplicateWith({
      operator: operator && operator.operator,
      comparator: newComparator,
      expressionType: EXPRESSION_TYPES.SIMPLE,
    }));
  }

  onInputComparatorChange(event) {
    this.onComparatorChange(event.target.value);
  }

  onComparatorChange(comparator) {
    this.props.onChange(this.props.adhocFilter.duplicateWith({
      comparator,
      expressionType: EXPRESSION_TYPES.SIMPLE,
    }));
  }

  isOperatorRelevant(operator) {
    return !(
      (this.props.datasource.type === 'druid' && TABLE_ONLY_OPERATORS.indexOf(operator) >= 0) ||
      (this.props.datasource.type === 'table' && DRUID_ONLY_OPERATORS.indexOf(operator) >= 0) ||
      (
        this.props.adhocFilter.clause === CLAUSES.HAVING &&
        HAVING_OPERATORS.indexOf(operator) === -1
      )
    );
  }

  focusComparator(ref) {
    ref && ref.focus();
  }

  render() {
    const { adhocFilter, options, datasource } = this.props;

    let subjectSelectProps = {
      value: adhocFilter.subject ? { value: adhocFilter.subject } : undefined,
      onChange: this.onSubjectChange,
      optionRenderer: VirtualizedRendererWrap(option => (
        <FilterDefinitionOption option={option} />
      )),
      valueRenderer: option => <span>{option.value}</span>,
      valueKey: 'filterOptionName',
    };

    if (datasource.type === 'druid') {
      subjectSelectProps = {
        ...subjectSelectProps,
        placeholder: t('%s column(s) and metric(s)', options.length),
        options: options,
      }
    } else if (datasource.type === 'table') {
      // we cannot support simple ad-hoc filters for metrics because we don't know what type 
      // the value should be cast to (without knowing the output type of the aggregate, which
      // becomes a rather complicated problem)
      let columns = options.filter(option => option.column_name)
      subjectSelectProps = {
        ...subjectSelectProps,
        placeholder: t('%s column(s)', columns.length),
        options: columns,
      }
    }

    const operatorSelectProps = {
      placeholder: t('%s operators(s)', Object.keys(OPERATORS).length),
      options: Object.keys(OPERATORS).filter(this.isOperatorRelevant).map((
        operator => ({ operator })
      )),
      value: adhocFilter.operator,
      onChange: this.onOperatorChange,
      optionRenderer: VirtualizedRendererWrap(
        operator => operator.operator == '<>' ? '!=' : operator.operator
      ),
      valueRenderer: operator => <span>
        {operator.operator == '<>' ? '!=' : operator.operator}
      </span>,
      valueKey: 'operator',
    };

    return (
      <span>
        <FormGroup>
          <OnPasteSelect {...this.selectProps} {...subjectSelectProps} />
        </FormGroup>
        <FormGroup>
          <OnPasteSelect {...this.selectProps} {...operatorSelectProps} />
        </FormGroup>
        <FormGroup>
          {
            (MULTI_OPERATORS.indexOf(adhocFilter.operator) >= 0 || this.state.suggestions.length > 0) ?
            <SelectControl
              multi={MULTI_OPERATORS.indexOf(adhocFilter.operator) >= 0}
              freeForm
              name="filter-comparator-value"
              value={adhocFilter.comparator}
              isLoading={false}
              choices={this.state.suggestions}
              onChange={this.onComparatorChange}
              showHeader={false}
              noResultsText="type a value here"
            /> :
            <input
              ref={this.focusComparator}
              type="text"
              onChange={this.onInputComparatorChange}
              value={adhocFilter.comparator || ''}
              className="form-control input-sm"
              placeholder={t('Filter value')}
            />
          }
        </FormGroup>
      </span>
    );
  }
}
AdhocFilterEditPopoverSimpleTabContent.propTypes = propTypes;
AdhocFilterEditPopoverSimpleTabContent.defaultProps = defaultProps;
