import React from 'react';
import Widget from '@wso2-dashboards/widget';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import VizG from 'react-vizgrammar';
import { Scrollbars } from 'react-custom-scrollbars';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Constants from './Constants';
import CustomTable from './CustomTable';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
});

class TopAPPCreators extends Widget {
    constructor(props) {
        super(props);

        this.chartConfig = {
            charts: [
                {
                    type: 'arc',
                    x: 'count',
                    color: 'CREATED_BY',
                    mode: 'pie',
                    colorScale: ['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff'],
                },
            ],
            legend: true,
            style: {
                legendTextColor: 'rgb(174, 169, 144)',
                legendTextSize: 30,
                legendTextBreakLength: 35,
            },
        };

        this.metadata = {
            names: ['CREATED_BY', 'count'],
            types: ['ordinal', 'linear'],
        };

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
                width: '30%',
                marginLeft: '5%',
                marginTop: '5%',
                display: 'flex',
                flexWrap: 'wrap',
            },
            formWrapper: {
                width: '90%',
                height: '15%',
                margin: 'auto',
            },
            vizWrapper: {
                height: '40%',
                margin: '5% auto',
            },
        };

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            data: [],
            metadata: this.metadata,
            limit: 0,
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
    }

    assembleQuery() {
        const { queryParamKey } = Constants;
        const queryParam = super.getGlobalState(queryParamKey);
        let limit = 5;

        if (queryParam.limit) {
            limit = queryParam.limit;
        }

        this.setState({ limit, data: [] });
        this.setQueryParam(limit);

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            let { query } = dataProviderConfigs.configs.config.queryData;
            query = query
                .replace('{{limit}}', limit);
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConfigs);
        }
    }

    componentDidMount() {
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembleQuery);
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + this.props.widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    setQueryParam(limit) {
        const { queryParamKey } = Constants;
        super.setGlobalState(queryParamKey, { limit });
    }

    handleDataReceived(message) {
        if (message.data) {
            const { limit } = this.state;
            this.setState({ data: message.data });
            this.setQueryParam(limit);
        }
    }

    handleChange(event) {
        const { queryParamKey } = Constants;
        const queryParam = super.getGlobalState(queryParamKey);
        this.setQueryParam(event.target.value);
        this.setState({ limit: queryParam.limit });
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleQuery();
    }


    getAppCreators() {
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
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        TOP APP CREATORS
                    </h3>
                </div>
                <div style={this.styles.formWrapper}>
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
                </div>
                <div>
                    <div style={this.styles.vizWrapper}>
                        <VizG
                            config={this.chartConfig}
                            metadata={this.state.metadata}
                            data={this.state.data}
                            theme={this.props.muiTheme.name}
                        />
                    </div>
                    <CustomTable
                        tableData={this.state.data}
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
                    <Paper elevation={1} style={{ padding: '5%', border: '2px solid #4555BB' }}>
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
                        {this.getAppCreators()}
                    </Scrollbars>
                </MuiThemeProvider>
            );
        }
    }
}


global.dashboard.registerWidget('TopAPPCreators', TopAPPCreators);
