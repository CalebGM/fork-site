import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';
import DocumentTitle from 'react-document-title';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Category from './components/Category.js';
import Publish from './components/Publish.js';
import Article from './components/Article.js';
import Adbar from './components/Adbar.js';
import Home from './components/Home.js';
import Author from './components/Author.js';
import About from './components/About.js';
import CheckLogin from './components/CheckLogin.js';
import AdminLogin from './components/AdminLogin.js';
import logo from './logo.svg';
import banner from './ata_banner.jpg';
import appStyles from './App.css';

class App extends Component {
	
	constructor(props) {
		super(props);
		this.state = { open: false };
	}
	
	componentDidMount() {
		document.addEventListener('click', this.closePopover.bind(this));
	}
	
	componentWillUnmount() {
		document.removeEventListener('click', this.closePopover.bind(this));
	}
	
	closePopover() {
		if(!this.preventNextClose && this.state.open) {
			this.setState({open: false});
		}
		
		this.preventNextClose = false;
	}
	openMenu() {
		if(!this.state.open) {
			this.preventNextClose = true;
			this.setState({open: true});
		}
	}

	render() {
		const { open } = this.state;
		const MenuStyle = open ? appStyles.SidebarOpen : appStyles.Sidebar;
		
		return (
			<DocumentTitle title={'Awesome Totally Awesome'}>
				 <div className={appStyles.App}>
				
					<div className={appStyles.Main}>
						<button className={appStyles.burger} onClick={this.openMenu.bind(this)}><i className="fa fa-bars"></i></button>
						<Link className={appStyles.Link} to="/">
							<div className={appStyles.header}>
								<Header />
							</div>
							<div className={appStyles.banner}>
							  <img src={banner} className={appStyles.logos} alt="logo" />
							</div>
						</Link>
						
						<div className={MenuStyle}>
							<Sidebar />
						</div>
						
						<div className={appStyles.Body}>
							<Route path="/realHome" component={CheckLogin} />
							<Route exact path="/realHome" component={Home}/>
							<Route exact path="/realHome/page=:num" component={Home}/>
							<Route exact path="/realHome/auth/:author/page=:num" component={Author}/>
							<Route exact path="/realHome/admin" component={AdminLogin}/>
							<Route exact path="/realHome/admin/publish" component={Publish}/> 
							<Route exact path="/realHome/story/:article" component={Article}/>
							<Route exact path="/realHome/cat/:subCat/page=:num" component={Category}/>
							<Route exact path="/realHome/about" component={About}/>
							
						</div>
					 </div>
					 
					 <div className={appStyles.Adbar}>
						<Adbar />
					</div>
					
				</div>
			</DocumentTitle>
		);
	}
}


export default App;
