import React from 'react';
import Widget from '@wso2-dashboards/widget';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import VizG from 'react-vizgrammar';
import { Scrollbars } from 'react-custom-scrollbars';
import amber from '@material-ui/core/colors/amber';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
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

class APIVersionUsageSummary extends Widget {
    constructor(props) {
        super(props);

        this.chartConfig = {
            charts: [
                {
                    type: 'scatter',
                    x: 'API_NAME',
                    y: 'SUB_COUNT',
                    color: 'SUB_COUNT',
                    size: 'REQ_COUNT',
                },
            ],
            append: false,
            style: {
                xAxisTickAngle: -8,
                tickLabelColor: '#506482',
            },
        };

        this.metadata = {
            names: ['API_NAME', 'CREATED_BY', 'REQ_COUNT', 'SUB_COUNT'],
            types: ['ordinal', 'ordinal', 'linear', 'linear'],
        };

        this.styles = {
            textField: {
                marginLeft: 8,
                marginRight: 8,
                width: 200,
            },
            form: {
                display: 'flex',
                flexWrap: 'wrap',
            },
            formControl: {
                margin: 5,
                minWidth: 120,
            },
            selectEmpty: {
                marginTop: 10,
            },
        };


        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            apiCreatedBy: 'All',
            usageData: [],
            apiIDlist: [],
            metadata: this.metadata,
            limit: 0,
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.handleChange = this.handleChange.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
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
                    faultyProviderConfig: true,
                });
            });
    }

    handlePublisherParameters(receivedMsg) {
        this.state.timeFrom = receivedMsg.from;
        this.state.timeTo = receivedMsg.to;
        this.state.perValue = receivedMsg.granularity;
        this.assembleApiUsageQuery();
    }

    resetState() {
        const { queryParamKey } = Constants;
        const queryParam = super.getGlobalState(queryParamKey);
        let apiCreatedBy = 'All';
        let limit = 5;
        if (queryParam.apiCreatedBy) {
            apiCreatedBy = queryParam.apiCreatedBy;
        }
        if (queryParam.limit) {
            limit = queryParam.limit;
        }
        this.state.apiCreatedBy = apiCreatedBy;
        this.state.limit = limit;
        this.setQueryParam(apiCreatedBy, limit);
    }

    assembleApiUsageQuery() {
        this.resetState();
        const { timeFrom, timeTo, perValue } = this.state;
        this.setState({ usageData: [] });
        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            let query = dataProviderConfigs.configs.config.queryData.apiusagequery;
            query = query
                .replace('{{from}}', timeFrom)
                .replace('{{to}}', timeTo)
                .replace('{{per}}', perValue)
                .replace('{{limit}}', this.state.limit);
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleApiUsageReceived, dataProviderConfigs);
        }
    }

    handleApiUsageReceived(message) {
        if (message.data) {
            const { createdByKeys } = Constants;
            let usageData = [];
            const currentUser = super.getCurrentUser();

            if (this.state.apiCreatedBy === createdByKeys.All) {
                usageData = message.data;
            } else if (this.state.apiCreatedBy === createdByKeys.Me) {
                message.data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[2]) {
                        usageData.push(dataUnit);
                    }
                });
            }
            this.setState({ usageData });
            this.setQueryParam(this.state.apiCreatedBy, this.state.limit);
        }
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    setQueryParam(apiCreatedBy, limit) {
        const { queryParamKey } = Constants;
        super.setGlobalState(queryParamKey, { apiCreatedBy, limit });
    }

    handleChange(event) {
        const { queryParamKey } = Constants;
        const queryParam = super.getGlobalState(queryParamKey);
        this.setQueryParam(this.state.apiCreatedBy, event.target.value);
        this.state.limit = queryParam.limit;
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiUsageQuery();
    }

    apiCreatedHandleChange(event) {
        this.setQueryParam(event.target.value, this.state.limit);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiUsageQuery();
    }

    getApiCreators() {
        return (
            <div
                style={{
                    paddingLeft: 5,
                    paddingRight: 5,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        width: this.state.width * 0.5,
                        marginLeft: '3%',
                    }}
                >
                    <form style={this.styles.form} noValidate autoComplete='off'>
                        <TextField
                            id='limit-number'
                            label='Limit :'
                            value={this.state.limit}
                            onChange={this.handleChange}
                            type='number'
                            style={this.styles.textField}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin='normal'
                        />
                    </form>
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
                <div style={{
                    height: this.state.height * 0.40, width: this.state.width * 0.95, margin: 'auto', marginTop: 20,
                }}
                >
                    <CustomTable
                        tableData={this.state.usageData}
                    />
                </div>
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
                        {this.getApiCreators()}
                    </Scrollbars>
                </MuiThemeProvider>
            );
        }
    }
}


global.dashboard.registerWidget('APIVersionUsageSummary', APIVersionUsageSummary); // (widgetId,reactComponent)
