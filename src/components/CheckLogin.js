import React from 'react';
import { connect } from 'react-redux';
import { retrieveUserFromLocalStorage } from '../api/Cognito.js';
import { login, adminLogin } from '../actions';


class CheckLogin extends React.Component {
	
	componentDidMount() {
        const { dispatch } = this.props;
        const savedEmail = localStorage.getItem('User_Email');

        if (savedEmail) {
            this.setState({ email: savedEmail });
        }
        retrieveUserFromLocalStorage()
            .then((data) => {

                dispatch(login(data.username, data.email));
                if (data.group === 'Admins') {
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