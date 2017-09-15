import React from 'react';
import { connect } from 'react-redux';
import { login } from '../actions';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class CheckLogin extends React.Component {
	
	componentDidMount() {
		const { dispatch } = this.props;
		
		fetch(config.url + "/",
		{
			method: 'get',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				if (rs.isAdmin) {
					dispatch(login());
				}
			})
			.catch((error) => {
				console.log(error);
			})
	}
	
	render() {
		return null;
	}
	
}

export default connect()(CheckLogin)