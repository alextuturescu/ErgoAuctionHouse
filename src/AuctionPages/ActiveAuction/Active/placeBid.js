import React from 'react';
import {
    Button,
    Container,
    FormFeedback,
    FormGroup,
    FormText,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
} from 'reactstrap';
import {friendlyToken, isWalletSaved, showMsg,} from '../../../auction/helpers';
import SyncLoader from 'react-spinners/SyncLoader';
import {css} from '@emotion/core';
import {currencyToLong, isFloat, longToCurrency} from '../../../auction/serializer';
import {bidHelper} from "../../../auction/newBidAssm";
import {supportedCurrencies} from "../../../auction/consts";
import FakeModal from "../../fakeModal";

const override = css`
  display: block;
  margin: 0 auto;
`;

export default class PlaceBidModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modalLoading: false,
            assemblerModal: false,
            copied: false,
            bidAmount: longToCurrency(props.box.nextBid, -1, props.box.currency).toString(),
        };
        this.placeBid = this.placeBid.bind(this);
        this.openFake = this.openFake.bind(this);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.isOpen === true && this.props.isOpen === false) {
            this.setState({copied: false})
            if (this.state.bidAddress !== undefined) this.setState({assemblerModal: true})
        }
    }

    placeBid() {
        if (!isWalletSaved()) {
            showMsg(`Please configure the wallet first!`, true);
            return;
        }
        this.setState({modalLoading: true});
        const bidA = currencyToLong(this.state.bidAmount, supportedCurrencies[this.props.box.currency].decimal)
        bidHelper(bidA, this.props.box, this.props.assemblerModal, this.openFake)
            .finally((_) => {
                this.props.close()
                this.setState({modalLoading: false})
            });
    }

    openFake(bid, box, modal, original) {
        this.setState({
            bid: bid,
            box: box,
            modal: modal,
            original: original,
            fakeOpen: true
        })
    }

    render() {
        return (
            <span>
                <FakeModal bid={this.state.bid} modal={this.state.modal} box={this.state.box}
                           original={this.state.original} isOpen={this.state.fakeOpen}
                           close={() => this.setState({fakeOpen: !this.state.fakeOpen})}/>
                <Modal
                    isOpen={this.props.isOpen}
                    toggle={this.props.close}
                    className={this.props.className}
                >
                    <ModalHeader toggle={this.props.close}>
                        <span className="fsize-1 text-muted">
                            New bid for{' '}
                            {friendlyToken(this.props.box.assets[0], false, 5)}
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        <Container>
                            <Row>
                                <SyncLoader
                                    css={override}
                                    size={8}
                                    color={'#0086d3'}
                                    loading={this.state.modalLoading}
                                />
                            </Row>

                            <FormGroup>
                                <InputGroup>
                                    <Input
                                        type="number"
                                        value={this.state.bidAmount}
                                        invalid={
                                            currencyToLong(this.state.bidAmount, supportedCurrencies[this.props.box.currency].decimal) < this.props.box.nextBid
                                        }
                                        onChange={(e) => {
                                            if (isFloat(e.target.value)) {
                                                this.setState({
                                                    bidAmount: e.target.value,
                                                });
                                            }
                                        }}
                                        id="bidAmount"
                                    />
                                    <InputGroupAddon addonType="append">
                                        <InputGroupText>{this.props.box.currency}</InputGroupText>
                                    </InputGroupAddon>
                                    <FormFeedback invalid>
                                        Minimum bid value for this auction is{' '}
                                        {longToCurrency(this.props.box.nextBid, -1, this.props.box.currency)}{' '}
                                        {this.props.box.currency}
                                    </FormFeedback>
                                </InputGroup>
                                <FormText>Specify your bid amount.</FormText>
                            </FormGroup>
                        </Container>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            className="ml mr-2 btn-transition"
                            color="secondary"
                            onClick={this.props.close}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="mr-2 btn-transition"
                            color="secondary"
                            disabled={
                                currencyToLong(this.state.bidAmount, supportedCurrencies[this.props.box.currency].decimal) <
                                this.props.box.nextBid ||
                                this.state.modalLoading
                            }
                            onClick={this.placeBid}
                        >
                            Place Bid
                        </Button>
                    </ModalFooter>
                </Modal>

            </span>
        );
    }
}
