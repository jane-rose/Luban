import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actions as machineActions } from '../../flux/machine';
// import { WORKFLOW_STATUS_RUNNING } from '../../constants';
// import classNames from 'classnames';
import i18n from '../../lib/i18n';

class Enclosure extends PureComponent {
    static propTypes = {
        executeGcode: PropTypes.func.isRequired,
        headType: PropTypes.string,
        isConnected: PropTypes.bool.isRequired,
        connectionType: PropTypes.string.isRequired,
        setTitle: PropTypes.func.isRequired,
        server: PropTypes.object.isRequired
    }

    state = {
        isEnclosureReady: false,
        enclosureLed: 0,
        enclosureFan: 0,
        isEnclosureDoorEnabled: true
    }

    actions = {
        onClickToolHead: () => {
            const { server, isConnected, headType, connectionType } = this.props;
            console.log(server, isConnected, headType, connectionType,);
        },
        onHandleLed: async () => {
            let enclosureLed;
            if (this.state.enclosureLed === 0) {
                enclosureLed = 100;
            } else {
                enclosureLed = 0;
            }
            if (this.props.connectionType === 'wifi') {
                this.props.server.setEnclosureLight(enclosureLed, (errMsg, res) => {
                    if (errMsg) {
                        return;
                    }
                    if (res.result) {
                        this.setState({
                            ...this.state,
                            enclosureLed: res.led_power
                        });
                    }
                });
            } else {
                await this.props.executeGcode(`M1010 S3 P${enclosureLed};`);
                this.setState({
                    ...this.state,
                    enclosureLed
                });
            }
        },
        onHandleCoolingFans: async () => {
            let enclosureFan;
            if (this.state.enclosureFan === 0) {
                enclosureFan = 100;
            } else {
                enclosureFan = 0;
            }
            if (this.props.connectionType === 'wifi') {
                this.props.server.setEnclosureFan(enclosureFan, (errMsg, res) => {
                    if (errMsg) {
                        return;
                    }
                    if (res.result) {
                        this.setState({
                            ...this.state,
                            enclosureFan: res.fan_power
                        });
                    }
                });
            } else {
                await this.props.executeGcode(`M1010 S4 P${enclosureFan};`);
                this.setState({
                    ...this.state,
                    enclosureFan
                });
            }
        },
        onHandleDoorEnabled: () => {
            const isEnclosureDoorEnabled = !this.state.isEnclosureDoorEnabled;
            this.props.server.setDoorDetection(isEnclosureDoorEnabled, (errMsg, res) => {
                if (errMsg) {
                    return;
                }
                if (res.result) {
                    this.setState({
                        ...this.state,
                        isEnclosureDoorEnabled: res.enabled
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
        if (nextProps.server.getEnclosureStatus && this.props.connectionType === 'wifi') {
            nextProps.server.getEnclosureStatus((errMsg, res) => {
                if (errMsg) {
                    console.log(errMsg);
                } else {
                    const { isEnclosureReady, isEnclosureDoorEnabled, enclosureLed, enclosureFan } = res;
                    console.log('getEnclosureStatus');
                    this.setState({
                        isEnclosureReady,
                        isEnclosureDoorEnabled,
                        enclosureLed,
                        enclosureFan
                    });
                }
            });
        } else if (nextProps.executeGcode && this.props.connectionType === 'serial') {
            const result = nextProps.executeGcode('M1010');
            console.log('result', nextProps.executeGcode, result);
        }
    }

    render() {
        const { isEnclosureReady, isEnclosureDoorEnabled, enclosureLed, enclosureFan } = this.state;
        const { isConnected, connectionType } = this.props;
        console.log('isConnected', isConnected, connectionType);
        return (
            <div>
                <div className="sm-parameter-container">
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Enclosure Status')}</span>
                        <button
                            type="button"
                            className={!isEnclosureReady ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            disabled
                        >
                            {!!isEnclosureReady && <i className="fa fa-toggle-off" />}
                            {!isEnclosureReady && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!isEnclosureReady ? i18n._('On') : i18n._('Off')}
                        </button>
                    </div>
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Enclosure Light')}</span>
                        <button
                            type="button"
                            className={!enclosureLed ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            onClick={this.actions.onHandleLed}
                            disabled={!isConnected}
                        >
                            {!!enclosureLed && <i className="fa fa-toggle-off" />}
                            {!enclosureLed && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!enclosureLed ? i18n._('Open') : i18n._('Close')}
                        </button>
                    </div>
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Enclosure Cooling Fan')}</span>
                        <button
                            type="button"
                            className={!enclosureFan ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            onClick={this.actions.onHandleCoolingFans}
                            disabled={!isConnected}
                        >
                            {!!enclosureFan && <i className="fa fa-toggle-off" />}
                            {!enclosureFan && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!enclosureFan ? i18n._('Open') : i18n._('Close')}
                        </button>
                    </div>
                    <div className="sm-parameter-row">
                        <span className="sm-parameter-row__label-lg">{i18n._('Door Detection')}</span>
                        <button
                            type="button"
                            className={!isEnclosureDoorEnabled ? 'sm-btn-small sm-btn-primary' : 'sm-btn-small sm-btn-danger'}
                            style={{
                                float: 'right'
                            }}
                            onClick={this.actions.onHandleDoorEnabled}
                            disabled={!isConnected || connectionType !== 'wifi'}
                        >
                            {isEnclosureDoorEnabled && <i className="fa fa-toggle-off" />}
                            {!isEnclosureDoorEnabled && <i className="fa fa-toggle-on" />}
                            <span className="space" />
                            {!isEnclosureDoorEnabled ? i18n._('Open') : i18n._('Close')}
                        </button>
                    </div>

                </div>
            </div>
        );
    }
}
const mapStateToProps = (state) => {
    // const { gcodeFiles } = state.workspace;
    const { server, isConnected, headType, connectionType, isEnclosureDoorOpen } = state.machine;

    return {
        isEnclosureDoorOpen,
        headType,
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
