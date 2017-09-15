import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Category from './components/Category.js';
import Publish from './components/Publish.js';
import Article from './components/Article.js';
import Adbar from './components/Adbar.js';
import Home from './components/Home.js';
import Author from './components/Author.js';
import CheckLogin from './components/CheckLogin.js';
import AdminLogin from './components/AdminLogin.js';
import logo from './logo.svg';
import appStyles from './App.css';

class App extends Component {

	render() {
		return (
			<Router>
			 <div className={appStyles.App}>
			 
				<div className={appStyles.Sidebar}>
					<Sidebar />
				</div>
				
				<div className={appStyles.Main}>
					<Link className={appStyles.Link} to="/">
						<div className={appStyles.header}>
							<Header />
						</div>
						<div className={appStyles.banner}>
						  <img src={logo} className={appStyles.logo} alt="logo" />
						  <h2>Awesome Totally Awesome</h2>
						</div>
					</Link>
					
					<div>
						<Route path="/" component={CheckLogin} />
						<Route exact path="/" component={Home}/>
						<Route exact path="/page=:num" component={Home}/>
						<Route exact path="/auth/:author/page=:num" component={Author}/>
						<Route exact path="/admin" component={AdminLogin}/>
						<Route exact path="/admin/publish" component={Publish}/> 
						<Route exact path="/story/:article" component={Article}/>
						<Route exact path="/cat/:subCat/page=:num" component={Category}/>
						
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
