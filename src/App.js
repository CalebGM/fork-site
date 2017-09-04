import React, { Component } from 'react';
import logo from './logo.svg';
import appStyles from './App.css';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Category from './components/Category.js';
import Publish from './components/Publish.js';
import Article from './components/Article.js';
import Adbar from './components/Adbar.js';

class App extends Component {
  render() {
    return (
		<Router>
		 <div className={appStyles.App}>
		 
			<div className={appStyles.Sidebar}>
				<Sidebar />
			</div>
			
			<div className={appStyles.Main}>
				<div className={appStyles.header}>
					<Header />
				</div>
				<div className={appStyles.banner}>
				  <img src={logo} className={appStyles.logo} alt="logo" />
				  <h2>Welcome to React</h2>
				</div>
				
				<div>
					<Route exact path="/" component={Header}/>
					<Route exact path="/admin/publish" component={Publish}/> 
					<Route exact path="/:subCat" component={Category}/>
					<Route exact path="/movies/:article" component={Article}/>
					<Route exact path="/comics/:article" component={Article}/>
					<Route exact path="/music/:article" component={Article}/>
					<Route exact path="/videogames/:article" component={Article}/>
				</div>
			 </div>
			 
			 <div className={appStyles.Adbar}>
				<Adbar />
			</div>
			
		</div>
				
		</Router>
    );
  }
}

export default App;
