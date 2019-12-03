import React from 'react'
import logo from './logo.svg'
import './App.css'
import "normalize.css"
import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import { Navbar, Button, HTMLTable } from "@blueprintjs/core"
import { BrowserRouter as Router, Route, Link } from "react-router-dom"
import Main from './screen/home/index'
import Stock from './screen/stock/index'
function App() {
  return (
    <div className='container'>
      <Router>
        <Navbar>

          <Navbar.Group align={'left'}>
            <Link to='/'><Navbar.Heading>Barcodeless</Navbar.Heading></Link>
            <Navbar.Divider />

            <Link to='/stock'><Button className="bp3-minimal" icon="database" text="Stock Manager" /></Link>

          </Navbar.Group>
        </Navbar>
        <Route path="/" exact component={Main} />
        <Route path="/stock" component={Stock} />
      </Router>
    </div>
  )
}

export default App
