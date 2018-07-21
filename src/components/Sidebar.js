import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../actions';
import { signOutUser } from '../api/Cognito.js';
import SidebarStyles from '../styles/Sidebar.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];
	


class Sidebar extends React.Component {
	
	
	onLogoutPress() {
        const { dispatch } = this.props;


        signOutUser()
            .then(() => {
                dispatch(logout());
            })
            .catch((err) => {
                console.log(err);
            })
		//fetch(config.url + "/adminLogout",
		//{
		//	method: 'get',
		//	headers: {
		//		'Content-Type': 'application/json'
		//	},
		//	credentials: 'include'
		//})
		//	.then((response) => {
		//		if(response.status === 200) {
		//			dispatch(logout());
		//		}
		//	})
		//	.catch((error) => {
		//		console.log(error);
		//	})
	}
	
	
	toLink(cat) {
		var formatCat = cat;

		var slashSplit = cat.split("/");
		if (slashSplit[1]) {
			formatCat = slashSplit[0] + "_" + slashSplit[1];
		}
		
		var split = formatCat.split("_");
		formatCat = split[0].charAt(0).toLowerCase() + split[0].slice(1);
		if (split[1]) {
			formatCat = formatCat + "_" + (split[1].charAt(0).toLowerCase() + split[1].slice(1));
		}
		return formatCat;
	}
	
	withoutUnderscore(cat) {
		var split = cat.split("_");
		var formatCat = split[0].charAt(0) + split[0].slice(1);
			
		if (split[1]) {
			return formatCat + " " + (split[1].charAt(0) + split[1].slice(1));
		}
			
		return formatCat;
	}
	
	render() {
        const { login, user } = this.props;

		return (
			<div className={SidebarStyles.Container}>
				{config.categories.map(cat => {
					let linkCat = this.toLink(cat);
					let formatCat = this.withoutUnderscore(cat)
					return (
						<Link className={SidebarStyles.Links} key={cat} to={`/cat/${linkCat}/page=1`} >
							{formatCat}
						</Link>
					)
				})}
				
                <Link className={SidebarStyles.Links} to="/about">About Us</Link>
                <Link className={SidebarStyles.Links} to="/announcements/page=1">Announcements</Link>
				
				{login ? (
					<div className={SidebarStyles.Admin}>
                        <Link className={SidebarStyles.Links} to="/profile">{user}</Link>
                        <Link className={SidebarStyles.Links} to="/" onClick={this.onLogoutPress.bind(this)}>Logout</Link>
					</div>
				) : (
                    <div className={SidebarStyles.Admin}>
                        <Link className={SidebarStyles.Links} to="/login">SignUp/Login</Link>
                    </div>
				)}
				
			</div>
		);
	}
}

const mapStateToProps = state => {
	return {
        login: state.user.login,
        user: state.user.username
	}
}

export default connect(mapStateToProps)(Sidebar)

