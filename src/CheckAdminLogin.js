/* global gapi */
import React from 'react';

function CheckAdminLogin(props) {
	var auth2;
	var googleUser;
	console.log('hi');
	
	function appStart() {
		gapi.load('auth2', initSigninV2);
	}
	
	function initSigninV2() {
		auth2 = gapi.auth2.getAuthInstance();
		console.log(auth2);
		
		if (!auth2) {
			console.log('hello');
			auth2 = gapi.auth2.init({
				client_id: "228784196763-6bihsvpsg5j6433659oejkma33pphq3j.apps.googleusercontent.com",
				scope: 'profile'
			});
		}
	
		auth2.isSignedIn.listen(signinChanged);
		
		auth2.currentUser.listen(userChanged);
		
		if(auth2.isSignedIn.get() == true) {
			auth2.signIn();
		} else {
			console.log('not signed in');
			return (
				<div class="g-signin2" data-onsuccess="onSignIn"></div>
			);
		}
		
		refreshValues();
	}
	
	function onSignIn(user) {
		var profile = user.getBasicProfile();
		console.log(profile);
	}
	
	function signinChanged(val) {
		console.log('Signin state changed to ', val);
	}
	
	function userChanged(user) {
		console.log('User now ', user);
		googleUser = user;
		//updateGoogleUser();
	}
	
	
	function refreshValues() {
		if (auth2) {
			console.log('Refreshing values....');
			
			googleUser = auth2.currentUser.get();
		}
	}
	
	return appStart();
	
	
	//function initClient() {
	//	gapi.load('auth2', function() {
	//		auth2 = gapi.auth2.init({
	//			client_id: "228784196763-6bihsvpsg5j6433659oejkma33pphq3j.apps.googleusercontent.com"
	//		});
	//		
	//		console.log(auth2);
	//		return auth2.attachClickHandler('signin-button', {}, onSuccess, onFailure);
	//	});
	//}
	//
	//function onSuccess(user) {
	//	console.log('is success');
	//	var token = user.getAuthResponse().id_token;
	//	
	//	fetch("http://localhost:3001/checkLogin",
	//	{
	//		method: 'post',
	//		headers: {
	//			'Content-Type': 'application/json'
	//		},
	//		body: JSON.stringify({ token: token })
	//	})
	//		.then((response) => response.json())
	//		.then((rs) => {
	//			if (rs.isLoggedAsAdmin) {
	//				console.log('Signed in as ', user);
	//				return true;
	//			} else {
	//				console.log('Nope, signed in as ', user);
	//				return false;
	//			}
	//		})
	//		.catch((error) => {
	//			console.log(error);
	//			return false;
	//		})
	//}
	//
	//function onFailure(error) {
	//	console.log('is failure', error);
	//	return false;
	//}
	//
	//return initClient();
}


export default CheckAdminLogin();