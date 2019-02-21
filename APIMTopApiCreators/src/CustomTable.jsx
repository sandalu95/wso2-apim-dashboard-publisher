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
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';
import Axios from 'axios';
import {
    defineMessages, IntlProvider,
} from 'react-intl';
import CustomTableHead from './CustomTableHead';
import CustomTableToolbar from './CustomTableToolbar';

/**
 * Language
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

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
    loadingIcon: {
        margin: 'auto',
        display: 'block',
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
 * Create React Component for Top Api Creators Table
 */
class CustomTable extends React.Component {
    /**
     * Creates an instance of CustomTable.
     * @param {any} props @inheritDoc
     * @memberof CustomTable
     */
    constructor(props) {
        super(props);

        this.state = {
            tableData: [],
            page: 0,
            rowsPerPage: 5,
            orderBy: 'apicount',
            order: 'desc',
            expanded: false,
            filterColumn: 'creator',
            query: '',
            localeMessages: null,
        };

        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);
    }

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
     * Load locale file.
     * @param {string} locale Locale name
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMTopApiCreators/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Render the Top Api Creators table
     * @return {ReactElement} customTable
     */
    render() {
        const { data, classes } = this.props;
        const {
            query, expanded, filterColumn, localeMessages, order, orderBy, rowsPerPage, page,
        } = this.state;

        const lowerCaseQuery = query.toLowerCase();

        this.state.tableData = query
            ? data.filter(x => x[filterColumn].toString().toLowerCase().includes(lowerCaseQuery))
            : data;
        const { tableData } = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, tableData.length - page * rowsPerPage);

        if (localeMessages) {
            return (
                <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
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
                                    {stableSort(tableData, getSorting(order, orderBy))
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((n) => {
                                            return (
                                                <TableRow
                                                    hover
                                                    tabIndex={-1}
                                                    key={n.id}
                                                >
                                                    <TableCell component='th' scope='row'>
                                                        {n.creator}
                                                    </TableCell>
                                                    <TableCell
                                                        numeric
                                                        style={{
                                                            paddingRight: '10%',
                                                        }}
                                                    >
                                                        {n.apicount}
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
                            count={tableData.length}
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
        } else {
            return (
                <div>
                    <CircularProgress className={classes.loadingIcon} />
                </div>
            );
        }
    }
}

CustomTable.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
    classes: PropTypes.instanceOf(Object).isRequired,
};

export default withStyles(styles)(CustomTable);
