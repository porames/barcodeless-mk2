import React from 'react'
import { Navbar, Button, Dialog } from "@blueprintjs/core"
import _ from 'lodash'
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as knnClassifier from '@tensorflow-models/knn-classifier'
import * as tf from '@tensorflow/tfjs'
import { Cart } from '../../component/Cart'

export default class Home extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            image: '',
            processing: false,
            started: false,
            transactionCompleted: false,
            result: [],
            promptPayQR: '',
            total: 0
        }
        this.snap = this.snap.bind(this)
        this.pay = this.pay.bind(this)
        this.delete = this.delete.bind(this)
        this.reset = this.reset.bind(this)
    }
    async componentDidMount() {
        this.net = await mobilenet.load()
        this.classifier = knnClassifier.create()
        await this.setupWebcam()
        var dataset = localStorage.getItem('trainedModel')
        if (!_.isEmpty(dataset)) {
            var tensorObj = JSON.parse(dataset)
            var obj = {}
            Object.keys(tensorObj).forEach((key) => {
                obj[key] = tf.tensor(tensorObj[key], [tensorObj[key].length / 1024, 1024])
            })
            this.classifier.setClassifierDataset(obj)
            console.log('model loaded')
        }
        else {
            console.log('no model found')
        }
        const savedData = localStorage.getItem('stock')
        if (!_.isEmpty(savedData)) {
            this.setState({ item: JSON.parse(savedData) })
        }

    }

    getTotal() {
        const cart = this.state.result
        var total = 0
        if (!_.isEmpty(cart)) {
            for (var i = 0; i < _.size(cart); i++) {
                total += parseInt(cart[i].price)
            }
            this.setState({ total: total })
        }
    }

    async snap() {
        if (this.classifier.getNumClasses() > 0) {
            this.setState({ processing: true, started: true })
            const webcamElement = document.getElementById('webcam')
            const activation = this.net.infer(webcamElement, 'conv_preds')
            const result = await this.classifier.predictClass(activation)
            console.log(result.label)
            const classes = this.state.item
            var i = _.indexOf(classes, _.find(classes, { id: result.label }))

            this.setState({ processing: false, result: this.state.result.concat(classes[i]) }, () => {
                console.log(this.state.result)
                this.getTotal()
            })
        }
    }
    async setupWebcam() {
        const webcamElement = document.getElementById('webcam');
        return new Promise((resolve, reject) => {
            const navigatorAny = navigator;
            navigator.getUserMedia = navigator.getUserMedia ||
                navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
                navigatorAny.msGetUserMedia;
            if (navigator.getUserMedia) {
                navigator.getUserMedia({ video: true },
                    stream => {
                        webcamElement.srcObject = stream;
                        webcamElement.addEventListener('loadeddata', () => resolve(), false);
                    },
                    error => reject());
            } else {
                reject();
            }
        });
    }

    reset(){
        this.setState({ showPay: false, started: false, total: 0, result: [] })
    }

    delete(index) {
        var state = this.state.result
        state.splice(_.indexOf(state, _.find(state, { id : index})), 1);
        this.setState({ item: state },()=>this.getTotal())
    }

    async pay() {
        this.setState({ showPay: true })
        const mobileNumber = '0878917227'
        const amount = parseInt(this.state.total)
        const payload = generatePayload(mobileNumber, { amount })
        const qr = await QRCode.toDataURL(payload)
        console.log(qr)
        this.setState({ promptPayQR: qr })
    }
    render() {
        return (
            <div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', width: '100vw' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <video autoPlay playsInline muted id="webcam" width="500" height="300"></video>
                        <Button text='Capture' onClick={this.snap} style={{ marginTop: '1.5em' }} />
                    </div>
                    <Dialog isOpen={this.state.showPay} >
                        <div className="bp3-dialog-header">
                            <span className="bp3-icon-large bp3-icon-credit-card"></span>
                            <h4 className="bp3-heading">Checkout</h4>
                            <button onClick={() => this.setState({ showPay: false })} aria-label="Close" className="bp3-dialog-close-button bp3-button bp3-minimal bp3-icon-cross"></button>
                        </div>
                        <div className="bp3-dialog-body" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
                            <img src={this.state.promptPayQR} />
                            <h3>Total: {this.state.total} Baht</h3>
                        </div>
                        <div className="bp3-dialog-footer">
                            <div className="bp3-dialog-footer-actions">
                                <Button text='Done' intent='success' onClick={() => this.reset()} aria-label="Close" className="bp3-button" />
                            </div>
                        </div>
                    </Dialog>
                    <div className="bp3-card" style={{ marginTop: '1.5em' }}>
                        <div style={{ height: '320px', overflow: 'auto', width: '100%' }}>
                            <Cart
                                homePage={true}
                                delete={this.delete}
                                data={this.state.result}
                                showDel={true}
                            />
                        </div>
                        <h3>Total: {this.state.total} Baht</h3>
                        <Button intent='primary' text='Checkout' onClick={this.pay} style={{ marginTop: '1.5em' }} />

                    </div>


                </div>


            </div>
        )
    }
}