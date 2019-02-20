import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FilterListIcon from '@material-ui/icons/FilterList';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Collapse from '@material-ui/core/Collapse';


function desc(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const rows = [
    {
        id: 'api', numeric: false, disablePadding: false, label: 'API NAME',
    },
    {
        id: 'version', numeric: false, disablePadding: false, label: 'VERSION',
    },
    {
        id: 'hits', numeric: true, disablePadding: false, label: 'HITS',
    },
];

class CustomTableHead extends React.Component {
    createSortHandler = property => (event) => {
        this.props.onRequestSort(event, property);
    };

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
                                    title='Sort'
                                    placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                                    enterDelay={300}
                                >
                                    <TableSortLabel
                                        active={orderBy === row.id}
                                        direction={order}
                                        onClick={this.createSortHandler(row.id)}
                                    >
                                        {row.label}
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
                    API VERSION USAGE SUMMARY
                </Typography>
            </div>
            <div className={classes.actions}>
                <Tooltip title='Filter By'>
                    <IconButton
                        className={classes.expand}
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label='Filter By'
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
                        label='Column Name'
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
                        <MenuItem value='api'>API NAME</MenuItem>
                        <MenuItem value='version'>VERSION</MenuItem>
                        <MenuItem value='hits'>HITS</MenuItem>
                    </TextField>
                    <TextField
                        id='query-search'
                        label='Search field'
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
    classes: PropTypes.object.isRequired,
    expanded: PropTypes.string.isRequired,
    filterColumn: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    handleExpandClick: PropTypes.func.isRequired,
    handleColumnSelect: PropTypes.func.isRequired,
    handleQueryChange: PropTypes.func.isRequired,
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
    paginationtoolbar: {
        height: 56,
        minHeight: 56,
        padding: '0 5%',
    },
    paginationcaption: {
        flexShrink: 0,
    },
    paginationselectRoot: {
        marginRight: '10px',
    },
    paginationselect: {
        paddingLeft: 8,
        paddingRight: 16,
    },
    paginationselectIcon: {
        top: 1,
    },
    paginationinput: {
        color: 'inherit',
        fontSize: 'inherit',
        flexShrink: 0,
    },
    paginationmenuItem: {
        backgroundColor: theme.palette.type === 'light' ? '#fff' : '#162638',
    },
    paginationactions: {
        marginLeft: 0,
    },
});

class CustomTable extends React.Component {
    state = {
        order: 'desc',
        orderBy: 'hits',
        data: [],
        page: 0,
        rowsPerPage: 5,
        expanded: false,
        filterColumn: 'api',
        query: '',
    };

    handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }

        this.setState({ order, orderBy });
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

    render() {
        const { classes, tableData } = this.props;
        let counter = 0;
        const ddata = [];
        let api = '';
        let version = '';
        let hits = 0;
        const lowerCaseQuery = this.state.query.toLowerCase();

        tableData.forEach((dataUnit) => {
            counter += 1;
            api = dataUnit[0];
            version = dataUnit[1];
            hits = dataUnit[3];
            ddata.push({ id: counter, api, version, hits });
        });

        this.state.data = this.state.query ? ddata.filter(x => x[this.state.filterColumn].toString().toLowerCase().includes(lowerCaseQuery)) : ddata;
        const {
            data, order, orderBy, rowsPerPage, page,
        } = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

        return (
            <Paper className={classes.root}>
                <CustomTableToolbar
                    expanded={this.state.expanded}
                    filterColumn={this.state.filterColumn}
                    query={this.state.query}
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
                                                {n.api}
                                            </TableCell>
                                            <TableCell component='th' scope='row'>
                                                {n.version}
                                            </TableCell>
                                            <TableCell numeric style={{ paddingRight: '10%' }}>{n.hits}</TableCell>
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
                        toolbar: classes.paginationtoolbar,
                        caption: classes.paginationcaption,
                        selectRoot: classes.paginationselectRoot,
                        select: classes.paginationselect,
                        selectIcon: classes.paginationselectIcon,
                        input: classes.paginationinput,
                        menuItem: classes.paginationmenuItem,
                        actions: classes.paginationactions,
                    }}
                />
            </Paper>
        );
    }
}

CustomTable.propTypes = {
    classes: PropTypes.object.isRequired,
    tableData: PropTypes.object.isRequired,
};

export default withStyles(styles)(CustomTable);
