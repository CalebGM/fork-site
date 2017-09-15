import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { login, nullRedirect } from '../actions';
import Admin from '../AdminLogin.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class AdminLogin extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = { username: '', password: '', redirectUrl: props.redirectUrl };
		this.handleUsernameChange = this.handleUsernameChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
	}
	
	handleUsernameChange(event) {
		this.setState({username: event.target.value});
	}
	
	handlePasswordChange(event) {
		this.setState({password: event.target.value});
	}
	
	checkLogin(e) {
		const { dispatch, redirectUrl } = this.props;
		
		e.preventDefault();
		var username = this.state.username;
		var password = this.state.password;
		
		fetch(config.url + "/checkLogin",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username: username, password: password }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				if (rs.isAdmin) {
					dispatch(login());
					if (redirectUrl) {
						dispatch(nullRedirect());
					}
				} else {
					alert('Wrong Username or Password');
				}
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	render() {
		const { redirectUrl } = this.state;
		const { login } = this.props;
		
		if(login && redirectUrl) {
			return <Redirect to={redirectUrl} />;
		}
			
		return (
			<div>
				{login ? (
					<div>
						<span>Hello Admin</span>
					</div>
				) : (
					<div className={Admin.background}>
						<div className={Admin.login}>
							<form name="login" id="login" onSubmit={this.checkLogin.bind(this)}>
								<span>Enter Username</span>
								<div>
									<input type="text" name="username" value={this.state.username} onChange={this.handleUsernameChange} required />
								</div>
											
								<br />
								
								<span>Enter Password</span>
								<div>
									<input type="password" name="password" value={this.state.password} onChange={this.handlePasswordChange} required />
									
								</div>
								<input type="submit" value="Login" form="login" />
							</form>
							
						</div>
					</div>
				)}
			</div>
		)
	}
}

const mapStateToProps = state => {
	return {
		login: state.login,
		redirectUrl: state.redirectUrl
	}
}

export default connect(mapStateToProps)(AdminLogin)

			



