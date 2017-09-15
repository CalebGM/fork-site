import React from 'react';
import Adbar from '../Adbar.css';

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
			<div className={Adbar.GoogleAd}>
				<ins
					className=''
					style=''
					google_ad_client: "ca-pub-2267602959249768"
					enable_page_level_ads: true
				>
				</ins>
			</div>
		);
	}
}

export default GoogleAd;