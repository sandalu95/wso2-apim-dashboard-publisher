
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
import Widget from '@wso2-dashboards/widget';
import { Scrollbars } from 'react-custom-scrollbars';
import Moment from 'moment';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import ArrowBack from '@material-ui/icons/ArrowBack';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {
    VictoryAxis, VictoryLabel, VictoryLine, VictoryTooltip,
} from 'victory';
import { defineMessages, IntlProvider, FormattedMessage } from 'react-intl';
import localeJSON from './resources/locale.json';
import CustomTable from './CustomTable';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});

const createdByKeys = {
    All: 'All',
    Me: 'Me',
};

const queryParamKey = 'apps';

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
 * Create React Component for APP Created Analytics
 * @class APPCreatedAnalytics
 * @extends {Widget}
 */
class APPCreatedAnalytics extends Widget {
    /**
     * Creates an instance of APPCreatedAnalytics.
     * @param {any} props @inheritDoc
     * @memberof APPCreatedAnalytics
     */
    constructor(props) {
        super(props);

        this.styles = {
            headingWrapper: {
                height: '10%',
                margin: 'auto',
                width: '97%',
            },
            formWrapper: {
                width: '97%',
                height: '10%',
                margin: 'auto',
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
            dataWrapper: {
                height: '80%',
            },
            chartWrapper: {
                width: '70%',
                height: '100%',
                float: 'left',
            },
            svgWrapper: {
                height: '100%',
                width: '100%',
            },
            tooltip: {
                fill: '#fff',
                fontSize: 8,
            },
            tableWrapper: {
                width: '30%',
                height: '100%',
                float: 'right',
                textAlign: 'right',
            },
            button: {
                backgroundColor: '#1d216b',
                width: '40%',
                height: '10%',
                color: '#fff',
                marginTop: '3%',
            },
        };

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            apiCreatedBy: 'All',
            appCreatedBy: 'All',
            subscribedTo: 'All',
            timeTo: null,
            timeFrom: null,
            sublist: [],
            apilist: [],
            applist: [],
            chartData: [],
            tableData: [],
            xAxisTicks: [],
            maxCount: 0,
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.assembleSubListQuery = this.assembleSubListQuery.bind(this);
        this.assembleApiListQuery = this.assembleApiListQuery.bind(this);
        this.assembleSubscriptionsQuery = this.assembleSubscriptionsQuery.bind(this);
        this.assembleMainQuery = this.assembleMainQuery.bind(this);
        this.handleSubListReceived = this.handleSubListReceived.bind(this);
        this.handleApiListReceived = this.handleApiListReceived.bind(this);
        this.handleSubscriptionsReceived = this.handleSubscriptionsReceived.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.apiCreatedHandleChange = this.apiCreatedHandleChange.bind(this);
        this.appCreatedHandleChange = this.appCreatedHandleChange.bind(this);
        this.subscribedToHandleChange = this.subscribedToHandleChange.bind(this);
        this.resetState = this.resetState.bind(this);
    }

    componentDidMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.setState({ localeMessages: defineMessages(localeJSON[locale]) || {} });

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

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
     * Retrieve params from publisher - DateTimeRange
     * @memberof APPCreatedAnalytics
     * */
    handlePublisherParameters(receivedMsg) {
        this.setState({
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
        }, this.assembleSubListQuery);
    }

    /**
     * Reset the state according to queryParam
     * @memberof APPCreatedAnalytics
     * */
    resetState() {
        const queryParam = super.getGlobalState(queryParamKey);
        let apiCreatedBy = 'All';
        let appCreatedBy = 'All';
        let subscribedTo = 'All';
        if (queryParam.apiCreatedBy) {
            apiCreatedBy = queryParam.apiCreatedBy;
        }
        if (queryParam.appCreatedBy) {
            appCreatedBy = queryParam.appCreatedBy;
        }
        if (queryParam.subscribedTo) {
            subscribedTo = queryParam.subscribedTo;
        }
        this.state.apiCreatedBy = apiCreatedBy;
        this.state.appCreatedBy = appCreatedBy;
        this.state.subscribedTo = subscribedTo;
        this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
    }

    /**
     * Formats the siddhi query - sublistquery
     * @memberof APPCreatedAnalytics
     * */
    assembleSubListQuery() {
        this.resetState();

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.sublistquery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleSubListReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleSubListQuery
     * @param {object} message - data retrieved
     * @memberof APPCreatedAnalytics
     * */
    handleSubListReceived(message) {
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;
        if (message.data) {
            const sublist = ['All'];
            message.data.forEach((dataUnit) => {
                sublist.push(dataUnit.toString());
            });
            this.setState({ sublist });
            this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APPCreatedAnalytics
     * */
    assembleApiListQuery() {
        this.resetState();

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apilistquery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleApiListReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleApiListQuery
     * @param {object} message - data retrieved
     * @memberof APPCreatedAnalytics
     * */
    handleApiListReceived(message) {
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;
        const currentUser = super.getCurrentUser();

        if (message.data) {
            const apilist = [['All', 'All']];

            if (apiCreatedBy === createdByKeys.All) {
                message.data.forEach((dataUnit) => {
                    apilist.push([dataUnit[0], dataUnit[1] + ' ' + dataUnit[2]]);
                });
            } else if (apiCreatedBy === createdByKeys.Me) {
                message.data.forEach((dataUnit) => {
                    if (currentUser.username === dataUnit[3]) {
                        apilist.push([dataUnit[0], dataUnit[1] + ' ' + dataUnit[2]]);
                    }
                });
            }
            this.setState({ apilist });
            this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleSubscriptionsQuery();
    }

    /**
     * Formats the siddhi query - subscriptionsquery
     * @memberof APPCreatedAnalytics
     * */
    assembleSubscriptionsQuery() {
        this.resetState();
        const { subscribedTo } = this.state;
        const apilist = this.state.apilist.slice(1);
        const last = this.state.apilist.slice(-1)[0][0];
        let text = "API_ID=='";
        apilist.forEach((api) => {
            if (api[0] !== last) {
                text += api[0] + "' or API_ID=='";
            } else {
                text += api[0] + "' ";
            }
        });

        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            let query = dataProviderConfigs.configs.config.queryData.subscriptionsquery;
            if (subscribedTo === 'All') {
                query = query
                    .replace('{{querystring}}', 'on (' + text + ')');
            } else {
                query = query
                    .replace('{{querystring}}', "on API_ID=='{{api}}'")
                    .replace('{{api}}', subscribedTo);
            }
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleSubscriptionsReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleSubscriptionsQuery
     * @param {object} message - data retrieved
     * @memberof APPCreatedAnalytics
     * */
    handleSubscriptionsReceived(message) {
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;

        if (message.data) {
            const applist = [];
            message.data.forEach((dataUnit) => {
                if (!applist.includes(dataUnit[0])) {
                    applist.push(dataUnit[0]);
                }
            });
            this.setState({ applist });
            this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleMainQuery();
    }

    /**
     * Formats the siddhi query - mainquery
     * @memberof APPCreatedAnalytics
     * */
    assembleMainQuery() {
        this.resetState();
        const {
            timeFrom, timeTo, applist, appCreatedBy,
        } = this.state;
        const last = applist[applist.length - 1];
        let text = '';
        applist.forEach((app) => {
            if (app !== last) {
                text += app + "' or APPLICATION_ID=='";
            } else {
                text += app;
            }
        });
        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            let query = dataProviderConfigs.configs.config.queryData.mainquery;
            query = query
                .replace('{{timeFrom}}', Moment(timeFrom).format('YYYY-MM-DD HH:mm:ss'))
                .replace('{{timeTo}}', Moment(timeTo).format('YYYY-MM-DD HH:mm:ss'));
            if (appCreatedBy === 'All' && text === '') {
                query = query
                    .replace('{{querystring}}', "AND APPLICATION_ID=='0'");
            } else if (appCreatedBy !== 'All' && text !== '') {
                query = query
                    .replace('{{querystring}}', "AND (APPLICATION_ID=='{{appList}}') AND CREATED_BY=='{{creator}}'")
                    .replace('{{appList}}', text)
                    .replace('{{creator}}', appCreatedBy);
            } else if (appCreatedBy !== 'All') {
                query = query
                    .replace('{{querystring}}', "AND APPLICATION_ID=='0' AND CREATED_BY=='{{creator}}'")
                    .replace('{{creator}}', appCreatedBy);
            } else {
                query = query
                    .replace('{{querystring}}', "AND (APPLICATION_ID=='{{appList}}')")
                    .replace('{{appList}}', text);
            }
            dataProviderConfigs.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data retrieved from assembleMainQuery
     * @param {object} message - data retrieved
     * @memberof APPCreatedAnalytics
     * */
    handleDataReceived(message) {
        const { apiCreatedBy, appCreatedBy, subscribedTo } = this.state;

        if (message.data.length !== 0) {
            const xAxisTicks = [];
            const chartData = [];
            const tableData = [];
            let index = 0;

            message.data.forEach((dataUnit) => {
                chartData.push({
                    x: new Date(dataUnit[2]).getTime(),
                    y: dataUnit[3] + index,
                    label: 'CREATED_TIME:' + Moment(dataUnit[2]).format('YYYY-MMM-DD hh:mm:ss') + '\nCOUNT:' + (dataUnit[3] + index++),
                });
                tableData.push([
                    dataUnit[1].toString(),
                    Moment(dataUnit[2]).format('YYYY-MMM-DD hh:mm:ss'),
                ]);
            });

            const maxCount = chartData[chartData.length - 1].y;

            const first = new Date(chartData[0].x).getTime();
            const last = new Date(chartData[chartData.length - 1].x).getTime();
            const interval = (last - first) / 10;
            let duration = 0;
            xAxisTicks.push(first);
            for (let i = 1; i <= 10; i++) {
                duration = interval * i;
                xAxisTicks.push(new Date(first + duration).getTime());
            }

            this.setState({
                chartData, tableData, xAxisTicks, maxCount,
            });
        } else {
            this.setState({ chartData: [], tableData: [] });
        }

        this.setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo);
    }

    /**
     * Updates query param values
     * @param {string} apiCreatedBy - API Created By menu option selected
     * @param {string} appCreatedBy - APP Created By menu option selected
     * @param {string} subscribedTo - Subscribed To menu option selected
     * @memberof APPCreatedAnalytics
     * */
    setQueryParam(apiCreatedBy, appCreatedBy, subscribedTo) {
        super.setGlobalState(queryParamKey, {
            apiCreatedBy,
            appCreatedBy,
            subscribedTo,
        });
    }

    /**
     * Handle API Created By menu select change
     * @param {Event} event - listened event
     * @memberof APPCreatedAnalytics
     * */
    apiCreatedHandleChange(event) {
        this.setQueryParam(event.target.value, this.state.appCreatedBy, 'All');
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleApiListQuery();
    }

    /**
     * Handle APP Created By menu select change
     * @param {Event} event - listened event
     * @memberof APPCreatedAnalytics
     * */
    appCreatedHandleChange(event) {
        this.setQueryParam(this.state.apiCreatedBy, event.target.value, this.state.subscribedTo);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleSubListQuery();
    }

    /**
     * Handle Subscribed To menu select change
     * @param {Event} event - listened event
     * @memberof APPCreatedAnalytics
     * */
    subscribedToHandleChange(event) {
        this.setQueryParam(this.state.apiCreatedBy, this.state.appCreatedBy, event.target.value);
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleSubscriptionsQuery();
    }

    /**
     * Return the data for widget
     * @returns {ReactElement} Render the data of APP Created Analytics widget
     * @memberof APPCreatedAnalytics
     * */
    getDataChart() {
        const { tableData, chartData } = this.state;
        const themeName = this.props.muiTheme.name;

        if (tableData.length !== 0 && chartData.length !== 0) {
            return (
                <div style={this.styles.dataWrapper}>
                    <div style={this.styles.chartWrapper}>
                        <svg viewBox='200 50 300 300' style={this.styles.svgWrapper}>
                            <VictoryLabel
                                x={30}
                                y={65}
                                style={{
                                    fill: themeName === 'dark' ? '#fff' : '#000',
                                    fontFamily: 'inherit',
                                    fontSize: 8,
                                    fontStyle: 'italic',
                                }}
                                text='COUNT'
                            />
                            <g transform='translate(0, 40)'>
                                <VictoryAxis
                                    scale='time'
                                    standalone={false}
                                    width={700}
                                    style={{
                                        grid: {
                                            stroke: tick => (tick === 0 ? 'transparent' : '#313f46'),
                                            strokeWidth: 1,
                                        },
                                        axis: {
                                            stroke: themeName === 'dark' ? '#fff' : '#000',
                                            strokeWidth: 1,
                                        },
                                        ticks: {
                                            size: 5,
                                            stroke: themeName === 'dark' ? '#fff' : '#000',
                                            strokeWidth: 1,
                                        },
                                    }}
                                    label='CREATED TIME'
                                    tickValues={this.state.xAxisTicks}
                                    tickFormat={
                                        (x) => {
                                            return Moment(x).format('YY/MM/DD hh:mm');
                                        }
                                    }
                                    tickLabelComponent={(
                                        <VictoryLabel
                                            dx={-5}
                                            dy={-5}
                                            angle={-40}
                                            style={{
                                                fill: themeName === 'dark' ? '#fff' : '#000',
                                                fontFamily: themeName === 'dark' ? '#fff' : '#000',
                                                fontSize: 8,
                                            }}
                                        />
                                    )}
                                    axisLabelComponent={(
                                        <VictoryLabel
                                            dy={20}
                                            style={{
                                                fill: themeName === 'dark' ? '#fff' : '#000',
                                                fontFamily: 'inherit',
                                                fontSize: 8,
                                                fontStyle: 'italic',
                                            }}
                                        />
                                    )}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    domain={[1, this.state.maxCount]}
                                    width={700}
                                    offsetX={50}
                                    orientation='left'
                                    standalone={false}
                                    style={{
                                        grid: {
                                            stroke: tick => (tick === 0 ? 'transparent' : '#313f46'),
                                            strokeWidth: 1,
                                        },
                                        axis: {
                                            stroke: themeName === 'dark' ? '#fff' : '#000',
                                            strokeWidth: 1,
                                        },
                                        ticks: {
                                            strokeWidth: 0,
                                        },
                                        tickLabels: {
                                            fill: themeName === 'dark' ? '#fff' : '#000',
                                            fontFamily: 'inherit',
                                            fontSize: 8,
                                        },
                                    }}
                                />
                                <VictoryLine
                                    data={this.state.chartData}
                                    labels={d => d.label}
                                    width={700}
                                    domain={{
                                        x: [this.state.xAxisTicks[0], this.state.xAxisTicks[this.state.xAxisTicks.length - 1]],
                                        y: [1, this.state.maxCount],
                                    }}
                                    scale={{ x: 'time', y: 'linear' }}
                                    standalone={false}
                                    style={{
                                        data: {
                                            stroke: themeName === 'dark' ? '#fff' : '#000',
                                            strokeWidth: 2,
                                        },
                                    }}
                                    labelComponent={(
                                        <VictoryTooltip
                                            orientation='right'
                                            pointerLength={0}
                                            cornerRadius={2}
                                            flyoutStyle={{
                                                fill: '#000',
                                                fillOpacity: '0.5',
                                                strokeWidth: 1,
                                            }}
                                            style={this.styles.tooltip}
                                        />
                                    )}
                                />
                            </g>
                        </svg>
                    </div>
                    <div style={this.styles.tableWrapper}>
                        <CustomTable
                            tableData={this.state.tableData}
                        />
                        <Button
                            variant='contained'
                            color='secondary'
                            style={this.styles.button}
                            onClick={() => {
                                window.location.href = '/portal/dashboards/apimanalytics/home';
                            }}
                        >
                            <ArrowBack />
                            <FormattedMessage id='back.btn' defaultMessage='BACK' />
                        </Button>
                    </div>
                </div>
            );
        } else {
            return (
                <div style={this.styles.dataWrapper}>
                    <Paper
                        elevation={1}
                        style={{
                            padding: '4%',
                            border: '1px solid #fff',
                            height: '10%',
                            marginTop: '5%',
                        }}
                    >
                        <Typography variant='h5' component='h3'>
                            <FormattedMessage id='nodata.error.heading' defaultMessage='No Data Available !' />
                        </Typography>
                        <Typography component='p'>
                            <FormattedMessage
                                id='nodata.error.body'
                                defaultMessage='No matching data available for the selected options.'
                            />
                        </Typography>
                    </Paper>
                </div>
            );
        }
    }

    /**
     * Return the content of APPCreatedAnalytics widget
     * @returns {ReactElement} Render the content of APP Created Analytics widget
     * @memberof APPCreatedAnalytics
     * */
    getAPPCount() {
        const themeName = this.props.muiTheme.name;

        return (
            <div
                style={{
                    background: themeName === 'dark' ? '#0e1e33' : '#fff',
                    height: '85%',
                    padding: '2.5% 1.5%',
                    margin: '1.5%',
                }}
            >
                <div style={this.styles.headingWrapper}>
                    <div style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        width: '40%',
                        paddingBottom: '15px',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='APP CREATED OVER TIME' />
                    </div>
                </div>
                <div style={this.styles.formWrapper}>
                    <form style={this.styles.form} noValidate autoComplete='off'>
                        <FormControl style={this.styles.formControl}>
                            <InputLabel shrink htmlFor='api-createdBy-label-placeholder'>
                                <FormattedMessage id='api.createdBy.label' defaultMessage='API Created By' />
                            </InputLabel>
                            <Select
                                value={this.state.apiCreatedBy}
                                onChange={this.apiCreatedHandleChange}
                                input={<Input name='api-createdBy' id='api-createdBy-label-placeholder' />}
                                displayEmpty
                                name='apiCreatedBy'
                                style={this.styles.selectEmpty}
                            >
                                <MenuItem value='All'>
                                    <FormattedMessage id='all.menuItem' defaultMessage='All' />
                                </MenuItem>
                                <MenuItem value='Me'>
                                    <FormattedMessage id='me.menuItem' defaultMessage='Me' />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl style={this.styles.formControl}>
                            <InputLabel shrink htmlFor='app-createdBy-label-placeholder'>
                                <FormattedMessage id='app.createdBy.label' defaultMessage='APP Created By' />
                            </InputLabel>
                            <Select
                                value={this.state.appCreatedBy}
                                onChange={this.appCreatedHandleChange}
                                input={<Input name='app-createdBy' id='app-createdBy-label-placeholder' />}
                                displayEmpty
                                name='appCreatedBy'
                                style={this.styles.selectEmpty}
                            >
                                {
                                    this.state.sublist.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                        <FormControl style={this.styles.formControl}>
                            <InputLabel shrink htmlFor='subscribedTo-label-placeholder'>
                                <FormattedMessage id='subscribedTo.label' defaultMessage='Subscribed To' />
                            </InputLabel>
                            <Select
                                value={this.state.subscribedTo}
                                onChange={this.subscribedToHandleChange}
                                input={<Input name='subscribedTo' id='subscribedTo-label-placeholder' />}
                                displayEmpty
                                name='subscribedTo'
                                style={this.styles.selectEmpty}
                            >
                                {
                                    this.state.apilist.map(option => (
                                        <MenuItem key={option} value={option[0]}>
                                            {option[1]}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </form>
                </div>
                {this.getDataChart()}
            </div>
        );
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APP Created Analytics widget
     * @memberof APPCreatedAnalytics
     */
    render() {
        const themeName = this.props.muiTheme.name;
        const { localeMessages } = this.state;

        if (this.state.faultyProviderConfig === true) {
            return (
                <IntlProvider locale={language} messages={localeMessages}>
                    <div
                        style={{
                            margin: 'auto',
                            width: '50%',
                            marginTop: '20%',
                        }}
                    >
                        <Paper
                            elevation={1}
                            style={{
                                padding: '5%',
                                border: '2px solid #4555BB',
                            }}
                        >
                            <Typography variant='h5' component='h3'>
                                <FormattedMessage id='config.error.heading' defaultMessage='Configuration Error !' />
                            </Typography>
                            <Typography component='p'>
                                <FormattedMessage
                                    id='config.error.body'
                                    defaultMessage='Cannot fetch provider configuration for APP Created Analytics widget'
                                />
                            </Typography>
                        </Paper>
                    </div>
                </IntlProvider>
            );
        } else {
            return (
                <IntlProvider locale={language} messages={localeMessages}>
                    <MuiThemeProvider
                        theme={themeName === 'dark' ? darkTheme : lightTheme}
                    >
                        <Scrollbars
                            style={{ height: this.state.height }}
                        >
                            {this.getAPPCount()}
                        </Scrollbars>
                    </MuiThemeProvider>
                </IntlProvider>
            );
        }
    }
}

global.dashboard.registerWidget('APPCreatedAnalytics', APPCreatedAnalytics);
