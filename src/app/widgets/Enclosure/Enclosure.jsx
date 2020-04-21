import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actions as machineActions } from '../../flux/machine';
import i18n from '../../lib/i18n';
import log from '../../lib/log';

class Enclosure extends PureComponent {
    static propTypes = {
        executeGcode: PropTypes.func.isRequired,
        enclosureLight: PropTypes.number.isRequired,
        enclosureFan: PropTypes.number.isRequired,
        isConnected: PropTypes.bool.isRequired,
        connectionType: PropTypes.string.isRequired,
        setTitle: PropTypes.func.isRequired,
        server: PropTypes.object.isRequired
    }

    state = {
        isReady: false,
        led: 0,
        fan: 0,
        isLedReady: true,
        isFanReady: true,
        isDoorEnabled: true
    }

    actions = {
        onHandleLed: async () => {
            let led;
            if (this.state.led === 0) {
                led = 100;
            } else {
                led = 0;
            }
            if (this.props.connectionType === 'wifi') {
                this.props.server.setEnclosureLight(led, (errMsg, res) => {
                    if (errMsg) {
                        log.error(errMsg);
                        return;
                    }
                    if (res) {
                        this.setState({
                            ...this.state,
                            led: res.led
                        });
                    }
                });
            } else {
                await this.props.executeGcode(`M1010 S3 P${led};`);
                this.setState({
                    ...this.state,
                    isLedReady: false
                });
            }
        },
        onHandleCoolingFans: async () => {
            let fan;
            if (this.state.fan === 0) {
                fan = 100;
            } else {
                fan = 0;
            }
            if (this.props.connectionType === 'wifi') {
                this.props.server.setEnclosureFan(fan, (errMsg, res) => {
                    if (errMsg) {
                        log.error(errMsg);
                        return;
                    }
                    if (res) {
                        this.setState({
                            ...this.state,
                            fan: res.fan
                        });
                    }
                });
            } else {
                await this.props.executeGcode(`M1010 S4 P${fan};`);
                this.setState({
                    ...this.state,
                    isFanReady: false
                });
            }
        },
        onHandleDoorEnabled: () => {
            const isDoorEnabled = !this.state.isDoorEnabled;
            this.props.server.setDoorDetection(isDoorEnabled, (errMsg, res) => {
                if (errMsg) {
                    log.error(errMsg);
                    return;
                }
                if (res) {
                    this.setState({
                        ...this.state,
                        isDoorEnabled: res.isDoorEnabled
                    });
                }
            });
        }
    }


    constructor(props) {
        super(props);
        this.props.setTitle(i18n._('Enclosure'));
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.enclosureLight !== this.props.enclosureLight && this.props.connectionType === 'serial') {
            this.setState({
                led: nextProps.enclosureLight,
                isLedReady: true
            });
        }
        if (nextProps.enclosureFan !== this.props.enclosureFan
         && this.props.connectionType === 'serial') {
            this.setState({
                fan: nextProps.enclosureFan,
                isFanReady: true
            });
        }
        if (nextProps.server.getEnclosureStatus && this.props.connectionType === 'wifi') {
            nextProps.server.getEnclosureStatus((errMsg, res) => {
                if (errMsg) {
                    log.error(errMsg);
                } else {
                    const { isReady, isDoorEnabled, led, fan } = res;
                    this.setState({
                        isReady,
                        isDoorEnabled,
                        led,
                        fan
                    });
                }
            });
        }
    }

    render() {
        const { isReady, isDoorEnabled, led, fan, isLedReady, isFanReady } = this.state;
        const { isConnected, connectionType } = this.props;
        return (
            <div>
                <div className="sm-parameter-container">
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Enclosure Status')}</span>
                        <button
                            type="button"
                            className={!isReady ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            disabled
                        >
                            {!!isReady && <i className="fa fa-toggle-off" />}
                            {!isReady && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!isReady ? i18n._('On') : i18n._('Off')}
                        </button>
                    </div>
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Enclosure Light')}</span>
                        <button
                            type="button"
                            className={!led ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            onClick={this.actions.onHandleLed}
                            disabled={(connectionType === 'serial' && !isLedReady) || !isConnected}
                        >
                            {!!led && <i className="fa fa-toggle-off" />}
                            {!led && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!led ? i18n._('On') : i18n._('Off')}
                        </button>
                    </div>
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Enclosure Cooling Fan')}</span>
                        <button
                            type="button"
                            className={!fan ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            onClick={this.actions.onHandleCoolingFans}
                            disabled={(connectionType === 'serial' && !isFanReady) || !isConnected}
                        >
                            {!!fan && <i className="fa fa-toggle-off" />}
                            {!fan && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!fan ? i18n._('On') : i18n._('Off')}
                        </button>
                    </div>
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Door Detection')}</span>
                        <button
                            type="button"
                            className={!isDoorEnabled ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            onClick={this.actions.onHandleDoorEnabled}
                            disabled={!isConnected || connectionType !== 'wifi'}
                        >
                            {isDoorEnabled && <i className="fa fa-toggle-off" />}
                            {!isDoorEnabled && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!isDoorEnabled ? i18n._('On') : i18n._('Off')}
                        </button>
                    </div>

                </div>
            </div>
        );
    }
}
const mapStateToProps = (state) => {
    const { server, isConnected, headType, connectionType, enclosureLight, enclosureFan } = state.machine;

    return {
        headType,
        enclosureLight,
        enclosureFan,
        isConnected,
        connectionType,
        server
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        executeGcode: (gcode, context) => dispatch(machineActions.executeGcode(gcode, context))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Enclosure);
