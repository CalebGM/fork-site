import React from 'react';
import GoogleAd from './GoogleAd.js';

function Adbar(props) {
	const {
	} = props;
	return (
		<div>
			<GoogleAd />
			<GoogleAd />
			<GoogleAd />
		</div>
	);
}

export default Adbar;