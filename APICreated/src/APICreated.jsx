
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
import Moment from 'moment';
import PlayCircleFilled from '@material-ui/icons/PlayCircleFilled';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import ApiIcon from './ApiIcon';

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
 * Create React Component for API Created Count
 * @class APICreated
 * @extends {Widget}
 */
class APICreated extends Widget {
    /**
     * Creates an instance of APICreated.
     * @param {any} props @inheritDoc
     * @memberof APICreated
     */
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            totalCount: 0,
            weekCount: 0,
            localeMessages: null,
        };

        this.styles = {
            headingWrapper: {
                height: '10%',
                margin: 'auto',
                paddingTop: '15px',
                width: '90%',
            },
            cIconWrapper: {
                float: 'left',
                width: '40%',
                height: '62%',
            },
            cIcon: {
                display: 'block',
                margin: 'auto',
                marginTop: '25%',
            },
            dataWrapper: {
                float: 'left',
                width: '60%',
                height: '50%',
                paddingTop: '8%',
            },
            weekCount: {
                margin: 0,
                marginTop: '5%',
                color: 'rgb(135,205,223)',
                letterSpacing: 1,
                fontSize: '80%',
            },
            typeText: {
                textAlign: 'left',
                fontWeight: 'normal',
                margin: 0,
                display: 'inline',
                marginLeft: '3%',
                letterSpacing: 1.5,
                fontSize: 'small',
            },
            icon: {
                position: 'absolute',
                bottom: '13%',
                right: '8%',
            },
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
        };

        this.assembleweekQuery = this.assembleweekQuery.bind(this);
        this.assembletotalQuery = this.assembletotalQuery.bind(this);
        this.handleWeekCountReceived = this.handleWeekCountReceived.bind(this);
        this.handleTotalCountReceived = this.handleTotalCountReceived.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }

    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, this.assembletotalQuery);
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
     * Load locale file.
     * @param {string} locale Locale name
     */
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APICreated/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    /**
     * Formats the siddhi query
     * @memberof APICreated
     * */
    assembletotalQuery() {
        const { providerConfig } = this.state;

        const dataProviderConfigs = _.cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.query = dataProviderConfigs.configs.config.queryData.totalQuery;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleTotalCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembletotalQuery
     * @param {object} message - data retrieved
     * @memberof APICreated
     * */
    handleTotalCountReceived(message) {
        if (message.data.length !== 0) {
            let [[totalCount]] = message.data;
            totalCount = totalCount < 10 ? ('0' + totalCount).slice(-2) : totalCount;
            this.setState({ totalCount });
        }
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.assembleweekQuery();
    }

    /**
     * Formats the siddhi query using selected options
     * @memberof APICreated
     * */
    assembleweekQuery() {
        const { providerConfig } = this.state;
        const weekStart = Moment().subtract(7, 'days');

        const dataProviderConfigs = _.cloneDeep(providerConfig);
        let query = dataProviderConfigs.configs.config.queryData.weekQuery;
        query = query
            .replace('{{weekStart}}', Moment(weekStart).format('YYYY-MM-DD HH:mm:ss.SSSSSSSSS'));
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleWeekCountReceived, dataProviderConfigs);
    }

    /**
     * Formats data received from assembleweekQuery
     * @param {object} message - data retrieved
     * @memberof APICreated
     * */
    handleWeekCountReceived(message) {
        if (message.data.length !== 0) {
            let [[weekCount]] = message.data;
            weekCount = weekCount < 10 ? ('0' + weekCount).slice(-2) : weekCount;
            this.setState({ weekCount });
        }
    }

    /**
     * @inheritDoc
     * @returns {ReactElement} Render the API Created Count widget
     * @memberof APICreated
     */
    render() {
        const themeName = this.props.muiTheme.name;
        const {
            localeMessages, faultyProviderConf, totalCount, weekCount,
        } = this.state;
        const { }

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
                                        defaultMessage='Cannot fetch provider configuration for API CREATED widget'
                                    />
                                </Typography>
                            </Paper>
                        </div>
                    </IntlProvider>
                );
            } else {
                return (
                    <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                        <div
                            style={{
                                background: themeName === 'dark'
                                    ? 'linear-gradient(to right, rgb(4, 31, 51) 0%, rgb(37, 113, 167) 46%, rgb(42, 71, 101) 100%'
                                    : '#fff',
                                width: '90%',
                                height: '85%',
                                margin: '5% 5%',
                            }}
                        >
                            <div style={this.styles.headingWrapper}>
                                <h3
                                    style={{
                                        borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #2571a7',
                                        paddingBottom: '10px',
                                        margin: 'auto',
                                        textAlign: 'left',
                                        fontWeight: 'normal',
                                        letterSpacing: 1.5,
                                    }}
                                >
                                    <FormattedMessage id='widget.heading' defaultMessage='TOTAL API COUNT' />
                                </h3>
                            </div>
                            <div style={this.styles.cIconWrapper}>
                                <ApiIcon
                                    strokeColor={themeName === 'dark' ? '#fff' : '#2571a7'}
                                    width='50%'
                                    height='50%'
                                    style={this.styles.cIcon}
                                />
                            </div>
                            <div style={this.styles.dataWrapper}>
                                <h1
                                    style={{
                                        margin: 'auto',
                                        textAlign: 'center',
                                        fontSize: '300%',
                                        display: 'inline',
                                        color: themeName === 'dark' ? '#fff' : '#2571a7',
                                    }}
                                >
                                    {totalCount}
                                </h1>
                                <h3 style={this.styles.typeText}>
                                    {totalCount === '01' ? 'API' : 'APIS'}
                                </h3>
                                <p style={this.styles.weekCount}>
                                    [
                                    {' '}
                                    {weekCount}
                                    {' '}
                                    {weekCount === '01' ? 'API' : 'APIS'}
                                    {' '}
                                    <FormattedMessage id='within.week.text' defaultMessage='WITHIN LAST WEEK ' />
                                    ]
                                </p>
                            </div>
                            <button
                                type='button'
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '21%',
                                    background: themeName === 'dark'
                                        ? 'linear-gradient(to right, rgba(37, 38, 41, 0.75) 0%, rgba(252, 252, 252, 0) 100%)'
                                        : '#fff',
                                    border: 'none',
                                    borderTop: themeName === 'dark' ? 'none' : '1.5px solid #000',
                                    color: themeName === 'dark' ? '#fff' : '#000',
                                    textAlign: 'left',
                                    padding: '0 5%',
                                    fontSize: '90%',
                                    letterSpacing: 1,
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    window.location.href = './API-Created-Analysis';
                                }}
                            >
                                <FormattedMessage id='overtime.btn.text' defaultMessage='Overtime Analysis' />
                                <PlayCircleFilled style={this.styles.icon} />
                            </button>
                        </div>
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

global.dashboard.registerWidget('APICreated', APICreated);
