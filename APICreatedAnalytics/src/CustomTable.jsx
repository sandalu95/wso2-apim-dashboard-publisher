
/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FilterListIcon from '@material-ui/icons/FilterList';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Collapse from '@material-ui/core/Collapse';
import { withStyles } from '@material-ui/core/styles';
import { defineMessages, IntlProvider, FormattedMessage } from 'react-intl';
import localeJSON from './resources/locale.json';
import CustomTableHead from './CustomTableHead';

/**
 * Compare two values and return the result
 * @param {object} a - data field
 * @param {object} b - data field
 * @param {string} orderBy - column to sort table
 * @return {number}
 * */
function desc(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

/**
 * Stabilize the data set and sort the data fields
 * @param {object} array - data set
 * @param {object} cmp - method to sort
 * @return {object}
 * */
function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

/**
 * Set the value received from desc() according to 'order'
 * @param {string} order - desc or asc
 * @param {string} orderBy - column to sort table
 * @return {object}
 * */
function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];
const locale = (languageWithoutRegionCode || language || 'en');
const localeMessages = defineMessages(localeJSON[locale]) || {};

const toolbarStyles = theme => ({
    root: {
        paddingRight: theme.spacing.unit,
    },
    title: {
        position: 'absolute',
        top: 0,
        left: 0,
        marginTop: '20px',
        marginLeft: '20px',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: '40%',
        marginTop: 0,
    },
    menu: {
        width: 150,
    },
    actions: {
        position: 'absolute',
        top: 0,
        right: 0,
        marginTop: '10px',
        marginRight: '10px',
    },
    expand: {
        marginLeft: 'auto',

    },
    collapsef: {
        display: 'flex',
        marginLeft: 'auto',
        marginRight: 0,
        marginTop: '60px',
    },
});

let CustomTableToolbar = (props) => {
    const {
        classes, handleExpandClick, expanded, filterColumn, handleColumnSelect, handleQueryChange, query,
    } = props;

    return (
        <Toolbar
            className={classes.root}
        >
            <div className={classes.title}>
                <Typography variant='h6' id='tableTitle'>
                    <FormattedMessage id='table.heading' defaultMessage='API CREATED TIMES' />
                </Typography>
            </div>
            <div className={classes.actions}>
                <Tooltip title={<FormattedMessage id='filter.label.title' defaultMessage='Filter By' />}>
                    <IconButton
                        className={classes.expand}
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label={<FormattedMessage id='filter.label.title' defaultMessage='Filter By' />}
                    >
                        <FilterListIcon />
                    </IconButton>
                </Tooltip>
            </div>
            <Collapse in={expanded} timeout='auto' unmountOnExit className={classes.collapsef}>
                <div>
                    <TextField
                        id='column-select'
                        select
                        label={<FormattedMessage id='filter.column.menu.heading' defaultMessage='Column Name' />}
                        className={classes.textField}
                        value={filterColumn}
                        onChange={handleColumnSelect}
                        SelectProps={{
                            MenuProps: {
                                className: classes.menu,
                            },
                        }}
                        margin='normal'
                    >
                        <MenuItem value='apiname'>
                            <FormattedMessage id='table.heading.apiname' defaultMessage='API NAME' />
                        </MenuItem>
                        <MenuItem value='createdtime'>
                            <FormattedMessage id='table.heading.createdtime' defaultMessage='CREATED TIME' />
                        </MenuItem>
                    </TextField>
                    <TextField
                        id='query-search'
                        label={<FormattedMessage id='filter.search.placeholder' defaultMessage='Search Field' />}
                        type='search'
                        value={query}
                        className={classes.textField}
                        onChange={handleQueryChange}
                        margin='normal'
                    />
                </div>
            </Collapse>
        </Toolbar>
    );
};

CustomTableToolbar.propTypes = {
    classes: PropTypes.instanceOf(Object),
    expanded: PropTypes.string.isRequired,
    filterColumn: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    handleExpandClick: PropTypes.func.isRequired,
    handleColumnSelect: PropTypes.func.isRequired,
    handleQueryChange: PropTypes.func.isRequired,
};

CustomTableToolbar.defaultProps = {
    classes: {},
};

CustomTableToolbar = withStyles(toolbarStyles)(CustomTableToolbar);

const styles = theme => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.type === 'light' ? '#fff' : '#162638',
    },
    table: {
        minWidth: 200,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    paginationRoot: {
        color: theme.palette.text.secondary,
        fontSize: theme.typography.pxToRem(12),
        '&:last-child': {
            padding: 0,
        },
    },
    paginationToolbar: {
        height: 56,
        minHeight: 56,
        padding: '0 5%',
    },
    paginationCaption: {
        flexShrink: 0,
    },
    paginationSelectRoot: {
        marginRight: '10px',
    },
    paginationSelect: {
        paddingLeft: 8,
        paddingRight: 16,
    },
    paginationSelectIcon: {
        top: 1,
    },
    paginationInput: {
        color: 'inherit',
        fontSize: 'inherit',
        flexShrink: 0,
    },
    paginationMenuItem: {
        backgroundColor: theme.palette.type === 'light' ? '#fff' : '#162638',
    },
    paginationActions: {
        marginLeft: 0,
    },
});

/**
 * Create React Component for API Created Times Table
 */
class CustomTable extends React.Component {
    state = {
        data: [],
        page: 0,
        rowsPerPage: 5,
        orderBy: 'createdtime',
        order: 'desc',
        expanded: false,
        filterColumn: 'apiname',
        query: '',
    };

    handleRequestSort = (event, property) => {
        const { order, orderBy } = this.state;
        let orderNew = 'desc';
        if (orderBy === property && order === 'desc') {
            orderNew = 'asc';
        }
        this.setState({ order: orderNew, orderBy: property });
    };

    handleChangePage = (event, page) => {
        this.setState({ page });
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({ rowsPerPage: event.target.value });
    };

    handleExpandClick = () => {
        this.setState(state => ({ expanded: !state.expanded }));
    };

    handleColumnSelect = (event) => {
        this.setState({ filterColumn: event.target.value });
    };

    handleQueryChange = (event) => {
        this.setState({ query: event.target.value });
    };

    /**
     * Render the Custom Table
     * @return {ReactElement} customTable
     */
    render() {
        const { classes, tableData } = this.props;
        const { query, expanded, filterColumn } = this.state;
        let counter = 0;
        const dataNew = [];
        const lowerCaseQuery = query.toLowerCase();

        tableData.forEach((dataUnit) => {
            counter += 1;
            dataNew.push({ id: counter, apiname: dataUnit[0], createdtime: dataUnit[1] });
        });
        this.state.data = query
            ? dataNew.filter(x => x[filterColumn].toString().toLowerCase().includes(lowerCaseQuery))
            : dataNew;
        const {
            data, order, orderBy, rowsPerPage, page,
        } = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <Paper className={classes.root}>
                    <CustomTableToolbar
                        expanded={expanded}
                        filterColumn={filterColumn}
                        query={query}
                        handleExpandClick={this.handleExpandClick}
                        handleColumnSelect={this.handleColumnSelect}
                        handleQueryChange={this.handleQueryChange}
                    />
                    <div className={classes.tableWrapper}>
                        <Table className={classes.table} aria-labelledby='tableTitle'>
                            <CustomTableHead
                                order={order}
                                orderBy={orderBy}
                                onRequestSort={this.handleRequestSort}
                            />
                            <TableBody>
                                {stableSort(data, getSorting(order, orderBy))
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((n) => {
                                        return (
                                            <TableRow
                                                hover
                                                tabIndex={-1}
                                                key={n.id}
                                            >
                                                <TableCell component='th' scope='row'>
                                                    {n.apiname}
                                                </TableCell>
                                                <TableCell component='th' scope='row'>
                                                    {n.createdtime}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                {emptyRows > 0 && (
                                    <TableRow style={{ height: 49 * emptyRows }}>
                                        <TableCell colSpan={6} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20, 25, 50, 100]}
                        component='div'
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        backIconButtonProps={{
                            'aria-label': 'Previous Page',
                        }}
                        nextIconButtonProps={{
                            'aria-label': 'Next Page',
                        }}
                        onChangePage={this.handleChangePage}
                        onChangeRowsPerPage={this.handleChangeRowsPerPage}
                        classes={{
                            root: classes.paginationRoot,
                            toolbar: classes.paginationToolbar,
                            caption: classes.paginationCaption,
                            selectRoot: classes.paginationSelectRoot,
                            select: classes.paginationSelect,
                            selectIcon: classes.paginationSelectIcon,
                            input: classes.paginationInput,
                            menuItem: classes.paginationMenuItem,
                            actions: classes.paginationActions,
                        }}
                    />
                </Paper>
            </IntlProvider>
        );
    }
}

CustomTable.propTypes = {
    classes: PropTypes.instanceOf(Object).isRequired,
    tableData: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomTable);
