import React from 'react'
import { Navbar, Button, HTMLTable } from "@blueprintjs/core"
import _ from 'lodash'
export class Cart extends React.Component {

    renderTableData() {
        return this.props.data.map((item, index) => {
            return (
                <tbody>
                    <tr key={index}>

                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.price}</td>
                        <td>
                            {this.props.stockPage &&
                                <Button text='Train' intent='primary' onClick={() => this.props.callTrain(item.id)} />
                            }
                            {this.props.showDel &&
                                <Button onClick={() => this.props.delete(item.id)} style={{ marginLeft: '1em' }} intent='danger' icon='trash' />
                            }
                        </td>
                    </tr>
                </tbody>
            )
        })
    }


    render() {
        return (
            <div>
                {!_.isEmpty(this.props.data) &&
                    <HTMLTable interactive={true} striped={true} style={{ minWidth: '300px', width: '100%' }} fill={true}>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Name</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        {this.renderTableData()}
                    </HTMLTable>
                }
                {_.isEmpty(this.props.data) &&
                    <div>
                        {this.props.homePage &&
                            <h3 style={{ textAlign: 'center' }}>Start checking out your items 💵💵💵</h3>
                        }
                        {this.props.stockPage &&
                            <h3 style={{ textAlign: 'center' }}>No Item in Stock 😢</h3>
                        }
                        
                    </div>
                }
            </div>
        )
    }
}