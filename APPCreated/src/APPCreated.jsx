import React from 'react';
import Widget from '@wso2-dashboards/widget';
import Moment from 'moment';
import WebFont from 'webfontloader';
import PlayCircleFilled from '@material-ui/icons/PlayCircleFilled';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import { defineMessages, IntlProvider, FormattedMessage } from 'react-intl';
import localeJSON from './resources/locale.json';
import CustomIcon from './CustomIcon';

WebFont.load({
    google: {
        families: ['Open+Sans:600', 'sans-serif'],
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
 * React Component for APP Created Count
 */
class APPCreated extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            totalCount: 0,
            weekCount: 0,
            localeMessages: {},
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
                color: 'rgb(163, 187, 230)',
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
        };

        this.props.glContainer.on('resize', () => this.setState({
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        }));

        this.handleDataReceived = this.handleDataReceived.bind(this);
    }

    componentDidMount() {
        const locale = (languageWithoutRegionCode || language || 'en');
        this.setState({ localeMessages: defineMessages(localeJSON[locale]) || {} });

        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, message.data.configs.providerConfig));
            })
            . catch((error) => {
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
     * formats data retrieved and loads to the widget
     * @param {object} message - data retrieved
     * */
    handleDataReceived(message) {
        let totalCount = 0;
        let weekCount = 0;
        const currentDate = new Date();
        const weekStart = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));

        message.data.forEach((dataUnit) => {
            totalCount += dataUnit[1];
            if (Moment(dataUnit[0]).unix() >= Moment(weekStart).unix()) {
                weekCount += dataUnit[1];
            }
        });

        if (totalCount < 10) {
            totalCount = `0${totalCount}`;
        }
        if (weekCount < 10) {
            weekCount = `0${weekCount}`;
        }

        this.setState({
            totalCount,
            weekCount,
        });
    }

    /**
     * renders the APP Created Count widget
     * @return {ReactElement} widgetBody
     */
    render() {
        const themeName = this.props.muiTheme.name;
        const { localeMessages } = this.state;

        if (this.state.faultyProviderConf === true) {
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
                                    defaultMessage='Cannot fetch provider configuration for APP CREATED widget'
                                />
                            </Typography>
                        </Paper>
                    </div>
                </IntlProvider>
            );
        } else {
            return (
                <IntlProvider locale={language} messages={localeMessages}>
                    <div
                        style={{
                            width: '90%',
                            height: '85%',
                            margin: '5% 5%',
                            background: themeName === 'dark'
                                ? 'linear-gradient(to right, rgb(3, 8, 68) 0%, rgb(47, 93, 197) 46%, rgb(42, 49, 101) 100%)'
                                : '#fff',
                            fontFamily: "'Open Sans', sans-serif",
                        }}
                    >
                        <div style={this.styles.headingWrapper}>
                            <h3
                                style={{
                                    borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #040f96',
                                    paddingBottom: '10px',
                                    margin: 'auto',
                                    marginTop: 0,
                                    textAlign: 'left',
                                    fontWeight: 'normal',
                                    letterSpacing: 1.5,
                                }}
                            >
                                <FormattedMessage id='widget.heading' defaultMessage='TOTAL APP COUNT' />
                            </h3>
                        </div>
                        <div style={this.styles.cIconWrapper}>
                            <CustomIcon
                                strokeColor={themeName === 'dark' ? '#fff' : '#040f96'}
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
                                    color: themeName === 'dark' ? '#fff' : '#040f96',
                                }}
                            >
                                {this.state.totalCount}
                            </h1>
                            <h3 style={this.styles.typeText}>
                                {this.state.totalCount === '01' ? 'APP' : 'APPS'}
                            </h3>
                            <p style={this.styles.weekCount}>
                                [
                                {' '}
                                {this.state.weekCount}
                                {' '}
                                {this.state.weekCount === '01' ? 'APP' : 'APPS'}
                                {' '}
                                <FormattedMessage id='within.week.text' defaultMessage='WITHIN LAST WEEK ' />
                                ]
                            </p>
                        </div>
                        <button
                            type='submit'
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
                            }}
                            onClick={() => {
                                window.location.href = '/portal/dashboards/apimanalytics/APP-Created-Analysis';
                            }}
                        >
                            <FormattedMessage id='overtime.btn.text' defaultMessage='Overtime Analysis' />
                            <PlayCircleFilled style={this.styles.icon} />
                        </button>
                    </div>
                </IntlProvider>
            );
        }
    }
}

global.dashboard.registerWidget('APPCreated', APPCreated);
