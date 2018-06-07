import React from 'react';
import { connect } from 'react-redux';
import { retrieveUserFromLocalStorage } from '../api/Cognito.js';
import { login, adminLogin } from '../actions';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class CheckLogin extends React.Component {
	
	componentDidMount() {
        const { dispatch } = this.props;
        const savedEmail = localStorage.getItem('User_Email');
        console.log(savedEmail);
        if (savedEmail) {
            this.setState({ email: savedEmail });
        }
        retrieveUserFromLocalStorage()
            .then((data) => {
                console.log(data);
                dispatch(login(data.username, data.email));
                if (data.group == 'Admins') {
                    dispatch(adminLogin());
                }

            })
            .catch((err) => {
                console.log(err);
            })
	}
	
	render() {
		return null;
	}
	
}

export default connect()(CheckLogin)