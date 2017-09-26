import React from 'react';
import { connect } from 'react-redux';
import { logout } from '../actions';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class Header extends React.Component {
	
	onLogoutPress() {
		const { dispatch } = this.props;
		
		fetch(config.url + "/adminLogout",
		{
			method: 'get',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		})
			.then((response) => {
				if(response.status === 200) {
					dispatch(logout());
				}
			})
			.catch((error) => {
				console.log(error);
			})
	}
		
	
	render() {
		const { login } = this.props;
		
		return (
			<div>
				{ login ? (
					<div style={{display: 'flex', justifyContent: 'flex-end'}}>
						<button onClick={this.onLogoutPress.bind(this)} >Logout</button>
					</div>
				) : (
					<div></div>
				)}
					
				<div style={{borderStyle: 'inset'}}>
					<h1>Mr. Kitagawa's Online Magazine!</h1>
				</div>
			</div>
		)
	}		
}

const mapStateToProps = state => {
	return {
		login: state.login
	}
}

export default connect(mapStateToProps)(Header)