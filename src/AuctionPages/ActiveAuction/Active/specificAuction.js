import React, {Fragment} from 'react';

import {currentBlock, currentHeight, followAuction,} from '../../../auction/explorer';
import {isWalletSaved, showMsg,} from '../../../auction/helpers';
import {css} from '@emotion/core';
import PropagateLoader from 'react-spinners/PropagateLoader';
import {Button,} from 'reactstrap';
import cx from 'classnames';
import TitleComponent2 from '../../../Layout/AppMain/PageTitleExamples/Variation2';
import {decodeBoxes,} from '../../../auction/serializer';
import NewAuctionAssembler from "./newAuctionAssembler";
import ShowAuctions from "./showActives";
import ShowHistories from "../../AuctionHistory/History/showHistories";
import SendModal from "./sendModal";

const override = css`
  display: block;
  margin: 0 auto;
`;

export default class SpecificAuctions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            auctions: [],
        };
        this.refreshInfo = this.refreshInfo.bind(this);
        this.openAuction = this.openAuction.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.toggleAssemblerModal = this.toggleAssemblerModal.bind(this);
    }

    toggleModal() {
        this.setState({
            modalAssembler: !this.state.modalAssembler,
        });
    }

    toggleAssemblerModal(address = '', bid = 0, isAuction = false, currency = 'ERG') {
        this.setState({
            assemblerModal: !this.state.assemblerModal,
            bidAddress: address,
            bidAmount: bid,
            isAuction: isAuction,
            currency: currency
        });
    }

    openAuction() {
        if (!isWalletSaved()) {
            showMsg(
                'In order to create a new auction, configure a wallet first.',
                true
            );
        } else {
            this.toggleModal();
        }
    }

    componentDidMount() {
        let parts = window.location.href.split('/')
        while (!parts[parts.length - 1]) parts.pop()
        this.setState({boxId: parts[parts.length - 1]})

        this.refreshInfo(true, true);
        this.refreshTimer = setInterval(this.refreshInfo, 5000);
    }

    componentWillUnmount() {
        if (this.refreshTimer !== undefined) {
            clearInterval(this.refreshTimer);
        }
    }

    refreshInfo(force = false, firstTime = false) {
        if (!force) {
            this.setState({lastUpdated: this.state.lastUpdated + 5});
            if (this.state.lastUpdated < 40) return;
        }
        this.setState({lastUpdated: 0});
        currentBlock()
            .then((block) => {
                this.setState({currentHeight: block.height});
                followAuction(this.state.boxId)
                    .then(res => [res])
                    .then((boxes) => {
                        decodeBoxes(boxes, block)
                            .then((boxes) => {
                                this.setState({
                                    auctions: boxes,
                                    loading: false,
                                });
                            })
                            .finally(() => {
                                this.setState({loading: false});
                            });
                    })
                    .catch((_) =>
                        console.log('failed to get boxes from explorer!')
                    );
            })
            .catch((_) => {
                if (force) {
                    showMsg(
                        'Error connecting to the explorer. Will try again...',
                        false,
                        true
                    );
                }
                if (!force) setTimeout(() => this.refreshInfo(true), 4000);
                else setTimeout(() => this.refreshInfo(true), 20000);
            });
    }

    render() {
        function getBoxDis(auctions) {
            if (auctions && auctions[0].spentTransactionId)
                return <ShowHistories
                    boxes={auctions}
                />
            else return <ShowAuctions
                auctions={auctions}
                preload={true}
            />
        }

        return (
            <Fragment>
                <NewAuctionAssembler
                    isOpen={this.state.modalAssembler}
                    close={this.toggleModal}
                    assemblerModal={this.toggleAssemblerModal}
                />

                <SendModal
                    isOpen={this.state.assemblerModal}
                    close={this.toggleAssemblerModal}
                    bidAmount={this.state.bidAmount}
                    isAuction={this.props.isAuction}
                    bidAddress={this.state.bidAddress}
                    currency={this.state.currency}
                />
                <div className="app-page-title">
                    <div className="page-title-wrapper">
                        <div className="page-title-heading">
                            <div
                                className={cx('page-title-icon', {
                                    'd-none': false,
                                })}
                            >
                                <i className="pe-7s-volume2 icon-gradient bg-night-fade"/>
                            </div>
                            <div>
                                Auction Details
                            </div>
                        </div>
                        <div className="page-title-actions">
                            <TitleComponent2/>
                        </div>
                        <Button
                            onClick={this.openAuction}
                            outline
                            className="btn-outline-lin m-2 border-0"
                            color="primary"
                        >
                            <i className="nav-link-icon lnr-plus-circle"> </i>
                            <span>New Auction</span>
                        </Button>
                    </div>
                </div>
                {this.state.loading ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <PropagateLoader
                            css={override}
                            size={20}
                            color={'#0086d3'}
                            loading={this.state.loading}
                        />
                    </div>
                ) : (
                    <div>
                        {getBoxDis(this.state.auctions)}
                    </div>
                )}
            </Fragment>
        );
    }
}
