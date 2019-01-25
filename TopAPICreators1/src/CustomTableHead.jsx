import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import TableSortLabel from '@material-ui/core/TableSortLabel';

const rows = [
    {
        id: 'creator', numeric: false, disablePadding: false, label: 'table.heading.creator',
    },
    {
        id: 'apicount', numeric: true, disablePadding: false, label: 'table.heading.apicount',
    },
];

/**
 * Table Head for Custom Table
 */
export default class CustomTableHead extends React.Component {
    createSortHandler = property => (event) => {
        const { onRequestSort } = this.props;
        onRequestSort(event, property);
    };

    /**
     * Render Table Head
     * @return {ReactElement} tableHead
     */
    render() {
        const { order, orderBy } = this.props;

        return (
            <TableHead>
                <TableRow>
                    {rows.map((row) => {
                        return (
                            <TableCell
                                key={row.id}
                                numeric={row.numeric}
                                padding={row.disablePadding ? 'none' : 'default'}
                                sortDirection={orderBy === row.id ? order : false}
                            >
                                <Tooltip
                                    title={<FormattedMessage id='sort.label.title' defaultMessage='Sort' />}
                                    placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                                    enterDelay={300}
                                >
                                    <TableSortLabel
                                        active={orderBy === row.id}
                                        direction={order}
                                        onClick={this.createSortHandler(row.id)}
                                    >
                                        <FormattedMessage
                                            id={row.label}
                                            defaultMessage={row.label.split('table.heading.')[1].toUpperCase()}
                                        />
                                    </TableSortLabel>
                                </Tooltip>
                            </TableCell>
                        );
                    }, this)}
                </TableRow>
            </TableHead>
        );
    }
}

CustomTableHead.propTypes = {
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
};
