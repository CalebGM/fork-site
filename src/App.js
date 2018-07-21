import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { Route, Link } from 'react-router-dom';
import DocumentTitle from 'react-document-title';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Category from './components/Category.js';
import Publish from './components/Publish.js';
import Story from './components/Story.js';
import Adbar from './components/Adbar.js';
import Home from './components/Home.js';
import Author from './components/Author.js';
import Profile from './components/Profile.js';
import Announcements from './components/Announcements.js';
import Announcement from './components/Announcement.js';
import About from './components/About.js';
import CheckLogin from './components/CheckLogin.js';
import UserLogin_SignUp from './components/UserLogin_SignUp.js';
//import logo from './logo.svg';
import appStyles from './styles/App.css';

class App extends Component {
	
	constructor(props) {
		super(props);
        this.state = { open: false, post: false };
        this.makePost = this.makePost.bind(this);
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


    makePost() {
        this.setState({ post: true });
    }

	render() {
		const { open, post } = this.state;
        const MenuStyle = open ? appStyles.SidebarOpen : appStyles.Sidebar;

        if (post) {
            return <Redirect to={`/publish`} />;
        }
		
		return (
			<DocumentTitle title={'Collaboration Treehouse'}>
				 <div className={appStyles.App}>
				
					<div className={appStyles.Main}>
						<button className={appStyles.burger} onClick={this.openMenu.bind(this)}><i className="fa fa-bars"></i></button>
						<Link className={appStyles.Link} to="/">
							<div className={appStyles.header}>
								<Header />
							</div>
                            {/*<div className={appStyles.banner}>
							  <img src={banner} className={appStyles.logos} alt="logo" />
							</div>*/}
						</Link>
						
						<div className={MenuStyle}>
							<Sidebar />
                        </div>
                        <div className={appStyles.postDiv}>
                            <Link className={appStyles.PostButton} to="/publish">Start New Story</Link>
                        </div>
						
						<div className={appStyles.Body}>
							<Route path="/" component={CheckLogin} />
							<Route exact path="/" component={Home}/>
							<Route exact path="/page=:num" component={Home}/>
							<Route exact path="/auth/:author/page=:num" component={Author}/>
							<Route exact path="/login" component={UserLogin_SignUp}/>
                            <Route exact path="/publish" component={Publish} />
                            <Route exact path="/story/:article/id=:id/at=:post/id=:postId" component={Story} />
                            <Route exact path="/story/:article/id=:id/at=:post/id=:postId/:showFull" component={Story} />
                            <Route exact path="/profile" component={Profile} />
							<Route exact path="/story/:article/id=:id" component={Story}/>
                            <Route exact path="/cat/:subCat/page=:num" component={Category} />
                            <Route exact path="/announcements/page=:num" component={Announcements} />
                            <Route exact path="/announcement/:title/id=:id" component={Announcement} />
							<Route exact path="/about" component={About}/>
							
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
