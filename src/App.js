import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Category from './components/Category.js';
import Publish from './components/Publish.js';

class App extends Component {
  render() {
    return (
		<Router>
		  <div className="App">
				<div className="Sidebar">
					<Sidebar />
				</div>
				<div className="Main">
						<div className="Header">
							<Header />
						</div>
					<div className="App-header">
					  <img src={logo} className="App-logo" alt="logo" />
					  <h2>Welcome to React</h2>
					</div>
					
					<div>
						<Route exact={true} path="/" component={Header}/>
						<Route exact={true} path="/admin/publish" component={Publish}/> 
						<Route exact={true} path="/:subCat" component={Category}/>
					
					
					</div>
				  </div>
				 </div>
		</Router>
    );
  }
}

export default App;
