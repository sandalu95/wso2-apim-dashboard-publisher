
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
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import { VictoryPie, VictoryLegend, VictoryTooltip } from 'victory';
import Axios from 'axios';
import {
    addLocaleData, defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
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
 * Create React Component for APIM Overall Api Stats
 * @class APIMOverallApiStats
 * @extends {Widget}
 */
class APIMOverallApiStats extends Widget {
    /**
     * Creates an instance of APIMOverallApiStats.
     * @param {any} props @inheritDoc
     * @memberof APIMOverallApiStats
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            availableAPIData: [],
            legendData: [],
            topAPIID: [],
            topAPIData: [],
            localeMessages: null,
        };

        this.styles = {
            headingWrapper: {
                height: '10%',
                margin: 'auto',
                width: '90%',
            },
            chartTitle: {
                height: '15%',
                display: 'flex',
                marginRight: 'auto',
            },
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.assembleApiAvailableQuery = this.assembleApiAvailableQuery.bind(this);
        this.assembleAPIDataQuery = this.assembleAPIDataQuery.bind(this);
        this.assembleTopAPIQuery = this.assembleTopAPIQuery.bind(this);
        this.handleApiAvailableReceived = this.handleApiAvailableReceived.bind(this);
        this.handleAPIDataReceived = this.handleAPIDataReceived.bind(this);
        this.handleTopAPIReceived = this.handleTopAPIReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale).catch(() => {
            this.loadLocale().catch(() => {
                // TODO: Show error message.
            });
        });

        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembleApiAvailableQuery);
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
     * Load locale file.
     * @param {string} locale Locale name
     * @returns {Promise} Promise
     * @memberof APIMOverallApiStats
     */
    loadLocale(locale = 'en') {
        return new Promise((resolve, reject) => {
            Axios.get(`${window.contextPath}/public/extensions/widgets/APIMOverallApiStats/locales/${locale}.json`)
                .then((response) => {
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    addLocaleData(require(`react-intl/locale-data/${locale}`));
                    this.setState({ localeMessages: defineMessages(response.data) });
                    resolve();
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Formats the siddhi query - apiavailablequery
     * @memberof APIMOverallApiStats
     * */
    assembleApiAvailableQuery() {
        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apiavailablequery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleApiAvailableReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembleApiAvailableQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStats
     * */
    handleApiAvailableReceived(message) {
        const legendData = [];
        if (message.data) {
            message.data.forEach((dataUnit) => {
                if (!legendData.includes({ name: dataUnit[0] })) {
                    legendData.push({ name: dataUnit[0] });
                }
            });
            this.setState({ legendData, availableAPIData: message.data });
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleTopAPIQuery();
    }

    /**
     * Formats the siddhi query - topapiquery
     * @memberof APIMOverallApiStats
     * */
    assembleTopAPIQuery() {
        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.topapiquery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleTopAPIReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembleTopAPIQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStats
     * */
    handleTopAPIReceived(message) {
        if (message.data) {
            this.setState({
                topAPIID: message.data,
            });
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleAPIDataQuery();
    }

    /**
     * Formats the siddhi query - apilistquery
     * @memberof APIMOverallApiStats
     * */
    assembleAPIDataQuery() {
        if (this.state.providerConfig) {
            const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
            dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.apilistquery;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleAPIDataReceived, dataProviderConfigs);
        }
    }

    /**
     * Formats data received from assembleAPIDataQuery
     * @param {object} message - data retrieved
     * @memberof APIMOverallApiStats
     * */
    handleAPIDataReceived(message) {
        const { topAPIID } = this.state;
        const topAPIData = [];
        topAPIID.forEach((apidata) => {
            const apiID = apidata[0];
            let apiName = '';
            message.data.forEach((dataUnit) => {
                if (dataUnit[0] === apiID) {
                    apiName = dataUnit[1] + ' ' + dataUnit[2];
                }
            });
            topAPIData.push([apiName, apidata[1]]);
        });
        this.setState({ topAPIData });
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
     * Return the content of APIMOverallApiStats widget
     * @returns {ReactElement} Render the content of APIM Overall Api Stats widget
     * @memberof APIMOverallApiStats
     * */
    getOverallStats() {
        const themeName = this.props.muiTheme.name;

        return (
            <div style={{
                backgroundColor: themeName === 'dark' ? '#0e1e33' : '#fff',
                width: '80%',
                margin: '5% auto',
                padding: '10% 5%',
            }}
            >
                <div style={this.styles.headingWrapper}>
                    <h3 style={{
                        borderBottom: themeName === 'dark' ? '1px solid #fff' : '1px solid #02212f',
                        paddingBottom: '10px',
                        margin: 'auto',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        letterSpacing: 1.5,
                    }}
                    >
                        <FormattedMessage id='widget.heading' defaultMessage='OVERALL API STATS' />
                    </h3>
                </div>

                <div>
                    <div style={{
                        marginTop: '10%',
                        marginBottom: '10%',
                        background: themeName === 'dark' ? '#162638' : '#f7f7f7',
                        padding: '5%',
                    }}
                    >
                        <div style={this.styles.chartTitle}>
                            <FormattedMessage id='chart.heading' defaultMessage='API AVAILABILITY :' />
                        </div>
                        <svg viewBox='0 0 600 400'>
                            <VictoryPie
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
                                        style={{ fill: '#fff', fontSize: 25 }}
                                    />
                                )}
                                width={400}
                                height={400}
                                standalone={false}
                                padding={{
                                    left: 50, bottom: 50, top: 50, right: 50,
                                }}
                                colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff']}
                                data={this.state.availableAPIData}
                                x={0}
                                y={1}
                                labels={d => `${d[0]} : ${((d[1] / (_.sumBy(this.state.availableAPIData, o => o[1]))) * 100).toFixed(2)}%`}
                            />
                            <VictoryLegend
                                standalone={false}
                                colorScale={['#385dbd', '#030d8a', '#59057b', '#ab0e86', '#e01171', '#ffe2ff']}
                                x={400}
                                y={20}
                                gutter={20}
                                rowGutter={{ top: 0, bottom: -10 }}
                                style={{
                                    labels: {
                                        fill: '#9e9e9e',
                                        fontSize: 25,
                                    },
                                }}
                                data={this.state.legendData}
                            />
                        </svg>
                    </div>
                    <CustomTable
                        tableData={this.state.topAPIData}
                    />
                </div>
            </div>
        );
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the APIM Overall Api Stats widget
     * @memberof APIMOverallApiStats
     */
    render() {
        const themeName = this.props.muiTheme.name;
        const {
            localeMessages, faultyProviderConf, height,
        } = this.state;

        if (localeMessages) {
            if (faultyProviderConf) {
                return (
                    <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
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
                                        defaultMessage='Cannot fetch provider configuration for APIM Overall Api Stats widget'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    </IntlProvider>
                );
            } else {
                return (
                    <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                        <MuiThemeProvider
                            theme={themeName === 'dark' ? darkTheme : lightTheme}
                        >
                            <Scrollbars
                                style={{ height }}
                            >
                                {this.getOverallStats()}
                            </Scrollbars>
                        </MuiThemeProvider>
                    </IntlProvider>
                );
            }
        } else {
            return (
                <div>
                    <CircularProgress style={this.styles.loadingIcon} />
                </div>
            );
        }
    }
}

global.dashboard.registerWidget('APIMOverallApiStats', APIMOverallApiStats);
