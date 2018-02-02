import React from 'react';
//import Adbar from '../Adbar.css';

class GoogleAd extends React.Component {
	constructor(props) {
		super(props);
	}
	
	componentDidMount() {
		(window.adsbygoogle = window.adsbygoogle || []).push({});
	}
	
	render() {
		const {
		} = this.props;
		
		return (
			<div className="">
				
			</div>
		);
	}
}

export default GoogleAd;