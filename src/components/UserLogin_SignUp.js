import React from 'react';
import DocumentTitle from 'react-document-title';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { login, adminLogin, nullRedirect } from '../actions';
import { signUpUser, signInUser, retrieveUserFromLocalStorage } from '../api/Cognito.js';
import Admin from '../styles/AdminLogin.css';

//var env = process.env.NODE_ENV || 'development';
//var config = require('../config.js')[env];

class UserLogin_SignUp extends React.Component {
	constructor(props) {
		super(props);
		
        this.state = {
            username: '',
            email: '',
            password: '',
            redirectUrl: props.redirectUrl,
            signUp: false,
            signUpErr: null,
            signInErr: null,
            newSign: false
        };
        this.switchSignInUp = this.switchSignInUp.bind(this);
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
    }

    componentDidMount() {
        const { dispatch, redirectUrl } = this.props;
        const savedEmail = localStorage.getItem('User_Email');
        console.log(savedEmail);
        if (savedEmail) {
            this.setState({ email: savedEmail });
        }
        retrieveUserFromLocalStorage()
            .then((data) => {
                console.log(data);
                dispatch(login(data.username, data.email));
                if (redirectUrl) {
                    dispatch(nullRedirect());
                }
            })
    }
	
	handleUsernameChange(event) {
		this.setState({username: event.target.value});
    }

    handleEmailChange(event) {
        this.setState({ email: event.target.value });
    }
	
	handlePasswordChange(event) {
		this.setState({password: event.target.value});
    }

    switchSignInUp(e) {
        var signUp = this.state.signUp;
        this.setState({ signUp: !signUp });
    }

    signIn(e) {
        const { dispatch, redirectUrl } = this.props;

        e.preventDefault();
        var username = this.state.username;
        var password = this.state.password;

        signInUser(username, password)
            .then((userObj) => {
                console.log(userObj);
                dispatch(login(username, userObj.email));
                localStorage.setItem('User_Email', userObj.email);
                if (redirectUrl) {
                    dispatch(nullRedirect());
                }
                if (userObj.group === 'Admins') {
                    dispatch(adminLogin());
                }
            })
            .catch((err) => {
                console.log(err.message);
                this.setState({ signInErr: err.message });
            })
    }
	
	signUpNew(e) {
		const { dispatch, redirectUrl } = this.props;
		
		e.preventDefault();
        var username = this.state.username;
        var email = this.state.email;
        var password = this.state.password;

        signUpUser(username, email, password)
            .then((name) => {
                console.log(name);
                dispatch(login(name, email));
                localStorage.setItem('User_Email', email);
                this.setState({ newSign: true });
            })
            .catch((err) => {
                console.log(err.message);
                this.setState({ signUpErr: err.message });
            })
		
		//fetch(config.url + "/checkLogin",
		//{
		//	method: 'post',
		//	headers: {
		//		'Content-Type': 'application/json'
		//	},
		//	body: JSON.stringify({ username: username, password: password }),
		//	credentials: 'include'
		//})
		//	.then((response) => response.json())
		//	.then((rs) => {
		//		if (rs.isAdmin) {
		//			dispatch(login());
		//			if (redirectUrl) {
		//				dispatch(nullRedirect());
		//			}
		//		} else {
		//			alert('Wrong Username or Password');
		//		}
		//	})
		//	.catch((error) => {
		//		console.log(error);
		//	});
	}
	
	render() {
		const { redirectUrl, signUp, signUpErr, signInErr, newSign } = this.state;
		const { login } = this.props;
	
        if (newSign && login) {
            return <Redirect to={`/verifyNew`} />
        }
        if (login && redirectUrl) {
            console.log('hello');
            return <Redirect to={`/`} />;
        } else if (login) {
            return <Redirect to={`/`} />;
        }
			
		return (
            <DocumentTitle title={'SignUp/Login - Collaboration Treehouse'} >
				{signUp ? (
                    <div className={Admin.background}>
                        <div className={Admin.login}>
                            <form name="signUp" id="signUp" onSubmit={this.signUpNew.bind(this)}>
                                <span>Enter Username</span>
                                <div>
                                    <input type="text" name="username" value={this.state.username} onChange={this.handleUsernameChange} required />
                                </div>

                                <br />

                                <span>Enter Email</span>
                                <div>
                                    <input type="text" name="email" value={this.state.email} onChange={this.handleEmailChange} required />
                                </div>

                                <br />

                                <span>Enter Password</span>
                                <div>
                                    <input type="password" name="password" value={this.state.password} onChange={this.handlePasswordChange} required />

                                </div>
                                <input type="submit" value="Sign Up" form="signUp" />
                            </form>
                            {signUpErr ? (<span>{signUpErr}</span>) : (<div></div>)}
                            
                        </div>
                        <button onClick={this.switchSignInUp}>Already have an account? Sign In</button>
                    </div>
				) : (
					<div className={Admin.background}>
						<div className={Admin.login}>
							<form name="login" id="login" onSubmit={this.signIn.bind(this)}>
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
                            {signInErr ? (<span>{signInErr}</span>) : (<div></div>)}
                        </div>
                       
                        <button onClick={this.switchSignInUp}>Don't have an account? Sign Up</button>
					</div>
				)}
			</DocumentTitle>
		)
	}
}

const mapStateToProps = state => {
	return {
		login: state.user.login,
		redirectUrl: state.user.redirectUrl
	}
}

export default connect(mapStateToProps)(UserLogin_SignUp)

			



