import React from 'react'
import { Callout, ProgressBar, Button, Dialog, InputGroup, ControlGroup, Elevation, Card } from "@blueprintjs/core"
import _ from 'lodash'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as knnClassifier from '@tensorflow-models/knn-classifier'
import * as tf from '@tensorflow/tfjs'
import { Cart } from '../../component/Cart'


export default class Stock extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            addState: true,
            showAddItem: false,
            training: false,
            showTest: false,
            item: [
            ],
            saved: false
        }
        this.train = this.train.bind(this)
        this.componentDidMount = this.componentDidMount.bind(this)
        this.addExample = this.addExample.bind(this)
        this.classify = this.classify.bind(this)
        this.addItem = this.addItem.bind(this)
        this.export = this.export.bind(this)
        this.delete = this.delete.bind(this)
    }
    async componentDidMount() {
        this.net = await mobilenet.load()
        this.classifier = knnClassifier.create()

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

        var savedData = localStorage.getItem('stock')
        if (!_.isEmpty(savedData)) {
            this.setState({ item: JSON.parse(savedData) })
        }

        const datasetCount = this.classifier.getClassExampleCount()
        this.setState({ datasetCount: datasetCount })
        console.log(datasetCount)
    }
    async addExample(classId) {
        const webcamElement = document.getElementById('webcam')
        const activation = this.net.infer(webcamElement, 'conv_preds')
        this.classifier.addExample(activation, classId)
        const datasetCount = this.classifier.getClassExampleCount()
        this.setState({ datasetCount: datasetCount, currentCount: datasetCount[classId] })
        console.log('trained', classId)
    }

    train(index) {
        this.setState({ showAddItem: true, classId: index, currentCount: this.state.datasetCount[index] }, () =>
            console.log(this.state.datasetCount))
    }
    export() {
        const dataset = this.classifier.getClassifierDataset()
        var datasetObj = {}
        Object.keys(dataset).forEach((key) => {
            let data = dataset[key].dataSync()
            datasetObj[key] = Array.from(data)
        })
        localStorage.setItem("stock", JSON.stringify(this.state.item))
        localStorage.setItem("trainedModel", JSON.stringify(datasetObj))
        this.setState({saved: true})
    }
    addItem() {
        if (!_.isEmpty(String(this.state.itemName)) && !_.isEmpty(String(this.state.price))) {
            const state = this.state.item
            let r = Math.random().toString(36).substring(7).toUpperCase();
            this.setState({
                item: state.concat({
                    id: r,
                    name: this.state.itemName,
                    price: this.state.price
                }),
                itemName: '',
                price: ''
            },()=>console.log(this.state.item))
        }
    }

    updateInput(e) {
        this.setState({ [e.target.id]: e.target.value })
    }

    async classify() {
        const webcamElement = document.getElementById('webcam')
        console.log(this.classifier)
        if (this.classifier.getNumClasses() > 0) {
            const activation = this.net.infer(webcamElement, 'conv_preds')
            const result = await this.classifier.predictClass(activation)
            console.log(result)
            const classes = this.state.item
            console.log(`prediction: ${JSON.stringify(classes[result.label])}\n probability: ${result.confidences[result.classIndex]}`)
        }
    }
    delete(index) {
        var state = this.state.item
        state.splice(_.indexOf(state, _.find(state, { id : index})), 1);
        var datasetCount = this.classifier.getClassExampleCount()
        this.setState({ item: state })
        if(!_.isUndefined(datasetCount[index])){
            this.classifier.clearClass(index)
        }
    }

    async setupWebcam() {
        const webcamElement = document.getElementById('webcam')
        return new Promise((resolve, reject) => {
            const navigatorAny = navigator
            navigator.getUserMedia = navigator.getUserMedia ||
                navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
                navigatorAny.msGetUserMedia
            if (navigator.getUserMedia) {
                navigator.getUserMedia({ video: true },
                    stream => {
                        webcamElement.srcObject = stream
                        webcamElement.addEventListener('loadeddata', () => resolve(), false)
                    },
                    error => reject())
            } else {
                reject()
            }
        })
    }
    render() {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', paddingTop: '3em' }}>
                    <h1>Stock</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <Dialog isOpen={this.state.showAddItem} onOpened={() => this.setupWebcam()}>

                            <div>
                                <div className="bp3-dialog-header">
                                    <span className="bp3-icon-large bp3-icon-inbox"></span>
                                    <h4 className="bp3-heading">{this.state.classId}</h4>
                                    <button onClick={() => this.setState({ showAddItem: false, training: false })} aria-label="Close" className="bp3-dialog-close-button bp3-button bp3-minimal bp3-icon-cross"></button>
                                </div>
                                <div className="bp3-dialog-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <video style={{ marginBottom: '1.5em' }} autoPlay playsInline muted id="webcam" width="500" height="300"></video>
                                    <div style={{ width: '100%' }}>
                                        <h4 style={{ textAlign: 'center' }}>Confidence ({this.state.currentCount}/10)</h4>
                                        <ProgressBar stripes={false} fill={true} value={this.state.currentCount / 10} intent={'success'} />
                                    </div>

                                </div>
                                <div className="bp3-dialog-footer">
                                    <div className="bp3-dialog-footer-actions">
                                        <button onClick={() => this.addExample(this.state.classId)} id='train' type="button" className="bp3-button">Train</button>
                                        <button onClick={() => this.setState({ showAddItem: false, training: false })} type="submit" className="bp3-button bp3-intent-primary">Done</button>
                                    </div>
                                </div>
                            </div>

                        </Dialog>
                        <Dialog isOpen={this.state.showTest} onOpened={() => this.setupWebcam()}>
                            <div className="bp3-dialog-header">
                                <span className="bp3-icon-large bp3-icon-inbox"></span>
                                <h4 className="bp3-heading">Dialog header</h4>
                                <button onClick={() => this.setState({ showTest: false })} aria-label="Close" className="bp3-dialog-close-button bp3-button bp3-minimal bp3-icon-cross"></button>
                            </div>
                            <div className="bp3-dialog-body">
                                <video autoPlay playsInline muted id="webcam" width="500" height="300"></video>
                            </div>
                            <div className="bp3-dialog-footer">
                                <div className="bp3-dialog-footer-actions">
                                    <button onClick={() => this.classify()} type="submit" className="bp3-button bp3-intent-primary">Classify</button>
                                </div>
                            </div>
                        </Dialog>
                        <div>
                            <Cart
                                delete={this.delete}
                                showDel={true}
                                stockPage={true}
                                callTrain={this.train}
                                data={this.state.item} />

                            <Card style={{ marginTop: '2em' }} elevation={Elevation.ONE}>
                                <h3>Add Items</h3>
                                <ControlGroup onChange={(e) => this.updateInput(e)} style={{ marginTop: '1.5em' }} fill={true} >

                                    <InputGroup value={this.state.itemName} id='itemName' placeholder='Item Name' />
                                    <InputGroup value={this.state.price} id='price' placeholder='Price' />
                                    <Button onClick={() => this.addItem()} icon='add' text='Add' />
                                </ControlGroup>
                                <Button icon='camera' text='Test' onClick={() => this.setState({ showTest: true })} style={{ marginTop: '1.5em', marginRight: '1em' }} />
                                <Button icon='floppy-disk' text='Save' onClick={() => this.export()} style={{ marginTop: '1.5em' }} />
                                {this.state.saved &&
                                    <Callout style={{marginTop: '1.5em'}} intent='success' title='Saved!'/>
                                }                                
                            </Card>
                        </div>


                    </div>
                </div>

            </div>
        )
    }
}