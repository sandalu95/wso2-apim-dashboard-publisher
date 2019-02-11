import React from 'react';
import Widget from '@wso2-dashboards/widget';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { Scrollbars } from 'react-custom-scrollbars';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import amber from '@material-ui/core/colors/amber';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Constants from './Constants';
import CustomTable from './CustomTable';


const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
        secondary: amber,
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
        secondary: amber,
    },
    typography: {
        useNextVariants: true,
    },
});

class TopAPIUsers extends Widget {
    constructor(props) {
        super(props);
        this.styles = {
            textField: {
                marginLeft: 8,
                marginRight: 8,
                width: 200,
            },
            headingWrapper: {
                height: '10%',
                margin: 'auto',
                width: '90%',
            },
            form: {
                display: 'flex',
                flexWrap: 'wrap',
            },
            formWrapper: {
                width: '30%',
                marginLeft: '8%',
                marginTop: '3%',
            },
        };


        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            limit: 0,
            apiCreatedBy: 'All',
            apiSelected: 'All',
            apiVersion: 'All',
            versionlist: [],
            apilist: [],
            data: [],
            metadata: this.metadata,
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.apiSelectedHandleChange = this.apiSelectedHandleChange.bind(this);
        this.apiVersionHandleChange = this.apiVersionHandleChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
    }

    componentDidMount() {
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + this.props.widgetID + "'. " + error);
                this.setState({
                    faultyProviderConf: true,
                });
            });
    }

    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
        }, this.assembleApiListQuery);
    }

    resetState() {
        const { queryParamKey } = Constants;
        const queryParam = super.getGlobalState(queryParamKey);
        let limit = 5;
        let apiCreatedBy = 'All';
        let apiSelected = 'All';
        let apiVersion = 'All';
        if (queryParam.limit) {
            limit = queryParam.limit;
        }
        if (queryParam.apiCreatedBy) {
            apiCreatedBy = queryParam.apiCreatedBy;
        }
        if (queryParam.apiSelected) {
            apiSelected = queryParam.apiSelected;
        }
        if (queryParam.apiVersion) {
            apiVersion = queryParam.apiVersion;
        }
        this.state.limit = limit;
        this.state.apiCreatedBy = apiCreatedBy;
        this.state.apiSelected = apiSelected;
        this.state.apiVersion = apiVersion;
        this.setQueryParam(limit, apiCreatedBy, apiSelected, apiVersion);
    }

    assembleApiListQuery() {
        this.resetState();
        this.setState({ apilist: [] });

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apilistquery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleApiListReceived, dataProviderConfigs);
        }
    }

    handleApiListReceived(message) {
        if (message.data) {
            const { createdByKeys } = Constants;
            const currentUser = super.getCurrentUser();
            const apilist = ['All'];
            const versionlist = ['All'];

            if (this.state.apiCreatedBy === createdByKeys.All) {
                message.data.forEach((dataUnit) => {
                    if (!apilist.includes(dataUnit[0])) {
                        apilist.push(dataUnit[0]);
                    }
                    if (this.state.apiSelected === dataUnit[0]) {
                        versionlist.push(dataUnit[1]);
                    }
                });
            } else if (this.state.apiCreatedBy === createdByKeys.Me) {
                message.data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[2]) {
                        if (!apilist.includes(dataUnit[0])) {
                            apilist.push(dataUnit[0]);
                        }
                        if (this.state.apiSelected === dataUnit[0]) {
                            versionlist.push(dataUnit[1]);
                        }
                    }
                });
            }
            this.setState({ apilist, versionlist });
            this.setQueryParam(this.state.limit, this.state.apiCreatedBy, this.state.apiSelected, this.state.apiVersion);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    assembleMainQuery() {
        this.resetState();
        const { timeFrom, timeTo, perValue, limit} = this.state;
        const apilist = this.state.apilist.slice(1);
        const last = this.state.apilist.slice(-1)[0];
        let text = "apiName=='";
        apilist.forEach((api) => {
            if (api !== last) {
                text += api + "' or apiName=='";
            } else {
                text += api + "' ";
            }
        });

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            let query = dataProviderConfigs.configs.config.queryData.mainquery;
            query = query
                .replace('{{from}}', timeFrom)
                .replace('{{to}}', timeTo)
                .replace('{{per}}', perValue)
                .replace('{{limit}}', limit);

            if (this.state.apiSelected === 'All' && this.state.apiVersion === 'All') {
                query = query
                    .replace('{{querystring}}', 'on (' + text + ')');
            } else if (this.state.apiSelected !== 'All' && this.state.apiVersion !== 'All') {
                query = query
                    .replace('{{querystring}}', "on apiName=='{{api}}' AND apiVersion=='{{version}}'")
                    .replace('{{api}}', this.state.apiSelected)
                    .replace('{{version}}', this.state.apiVersion);
            } else {
                query = query
                    .replace('{{querystring}}', "on apiName=='{{api}}'")
                    .replace('{{api}}', this.state.apiSelected);
            }
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConfigs);
        }
    }

    handleDataReceived(message) {
        const { limit, apiCreatedBy, apiSelected, apiVersion } = this.state;
        this.setState({ data: message.data });
        this.setQueryParam(limit, apiCreatedBy, apiSelected, apiVersion);
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    setQueryParam(limit, apiCreatedBy, apiSelected, apiVersion) {
        const { queryParamKey } = Constants;
        super.setGlobalState(queryParamKey, {
            limit,
            apiCreatedBy,
            apiSelected,
            apiVersion,
        });
    }

    handleLimitChange(event) {
        this.setQueryParam(event.target.value, this.state.apiCreatedBy, this.state.apiSelected, this.state.apiVersion);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    apiCreatedHandleChange(event) {
        this.setQueryParam(this.state.limit, event.target.value, 'All','All');
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    apiSelectedHandleChange(event) {
        this.setQueryParam(this.state.limit, this.state.apiCreatedBy, event.target.value, 'All');
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    apiVersionHandleChange(event) {
        this.setQueryParam(this.state.limit, this.state.apiCreatedBy, this.state.apiSelected, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }


    getTopAPIUsers() {
        return (
            <div style={{
                backgroundColor: this.props.muiTheme.name === 'dark' ? '#0e1e33' : '#fff',
                width: '80%',
                margin: '5% auto',
                padding: '10% 5%',
            }}
            >
                <div style={this.styles.headingWrapper}>
                    <h3 style={{
                        borderBottom: this.props.muiTheme.name === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        paddingBottom: '10px',
                        margin: 'auto',
                        marginTop: 0,
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        TOP API USERS
                    </h3>
                </div>
                <div
                    style={{
                        display: 'flex',
                        width: this.state.width * 0.5,
                        marginLeft: '3%',
                    }}
                >
                    <form style={this.styles.form}>
                        <FormControl style={this.styles.formControl}>
                            <InputLabel shrink htmlFor='api-createdBy-label-placeholder'>
                                Created By
                            </InputLabel>
                            <Select
                                value={this.state.apiCreatedBy}
                                onChange={this.apiCreatedHandleChange}
                                input={<Input name='apiCreatedBy' id='api-createdBy-label-placeholder' />}
                                displayEmpty
                                name='apiCreatedBy'
                                style={this.styles.selectEmpty}
                            >
                                <MenuItem value='All'>All</MenuItem>
                                <MenuItem value='Me'>Me</MenuItem>
                            </Select>
                        </FormControl>
                    </form>
                </div>
                <div>
                    <form style={this.styles.form}>
                        <FormControl style={this.styles.formControl}>
                            <InputLabel shrink htmlFor='apiSelected-label-placeholder'>
                                API Name
                            </InputLabel>
                            <Select
                                value={this.state.apiSelected}
                                onChange={this.apiSelectedHandleChange}
                                input={<Input name='apiSelected' id='apiSelected-label-placeholder' />}
                                displayEmpty
                                name='apiSelected'
                                style={this.styles.selectEmpty}
                            >
                                {
                                    this.state.apilist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={this.styles.formControl}>
                            <InputLabel shrink htmlFor='apiVersion-label-placeholder'>
                                API Version
                            </InputLabel>
                            <Select
                                value={this.state.apiVersion}
                                onChange={this.apiVersionHandleChange}
                                input={<Input name='apiVersion' id='apiVersion-label-placeholder' />}
                                displayEmpty
                                name='apiVersion'
                                style={this.styles.selectEmpty}
                            >
                                {
                                    this.state.versionlist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </form>
                </div>
                <div style={this.styles.formWrapper}>
                    <form style={this.styles.form} noValidate autoComplete='off'>
                        <TextField
                            id='limit-number'
                            label='Limit :'
                            value={this.state.limit}
                            onChange={this.handleLimitChange}
                            type='number'
                            style={this.styles.textField}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin='normal'
                        />
                    </form>
                </div>
                <CustomTable
                    tableData={this.state.data}
                />
            </div>
        );
    }


    render() {
        if (this.state.faultyProviderConfig === true) {
            return (
                <div
                    style={{
                        margin: 'auto',
                        width: '50%',
                        marginTop: 100,
                    }}
                >
                    <Paper elevation={1} style={{ padding: 30, backgroundColor: amber[300] }}>
                        <Typography variant='h5' component='h3'>
                            Not Configured
                        </Typography>
                        <Typography component='p'>
                            Refer our documentation to correctly configure API Manager Analytics
                        </Typography>
                    </Paper>
                </div>
            );
        } else {
            return (
                <MuiThemeProvider
                    theme={this.props.muiTheme.name === 'dark' ? darkTheme : lightTheme}
                >
                    <Scrollbars
                        style={{ height: this.state.height }}
                    >
                        {this.getTopAPIUsers()}
                    </Scrollbars>
                </MuiThemeProvider>
            );
        }
    }
}


global.dashboard.registerWidget('TopAPIUsers', TopAPIUsers); // (widgetId,reactComponent)
