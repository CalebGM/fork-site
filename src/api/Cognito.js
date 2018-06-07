import { CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails,
    WebIdentityCredentials
} from 'amazon-cognito-identity-js';
//import AWS from 'amazon-cognito-js';
import AWS from 'aws-sdk';
console.log(AWS);

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];



export function signUpUser(username, email, password) {
    const p = new Promise((res, rej) => {

        const attributeList = [];
        console.log(email, password);
        const dataEmail = {
            Name: 'email',
            Value: email
        };

        //const dataUsername = {
        //    Name: 'custom:username',
        //    Value: username
        //};

        const attributeEmail = new CognitoUserAttribute(dataEmail);
        //const attributeUsername = new CognitoUserAttribute(dataUsername);

        attributeList.push(attributeEmail);

        config.userPool.signUp(username, password, attributeList, null, function (err, result) {
            if (err) {
                rej(err);
                return;
            } else {
                console.log(username);
                res(username);
            }
        });
    });
    return p;
}



export function verifyUserAccount(email, pin) {
    const p = new Promise((res, rej) => {
        const userData = {
            Username: email,
            Pool: config.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        cognitoUser.confirmRegistration(pin, true, function (err, result) {
            if (err) {
                console.log(err);
                rej(err);
                return;
            }
            if (result == "SUCCESS") {
                console.log("Successfully verified account!");
                cognitoUser.signOut();
                res();
            } else {
                rej("Could not verify account");
            }
        })
    })
    return p;
}


export function signInUser(username, password) {
    const p = new Promise((res, rej) => {
        const authenticationDetails = new AuthenticationDetails({ Username: username, Password: password });

        const userData = {
            Username: username,
            Pool: config.userPool
        }
        const cognitoUser = new CognitoUser(userData);
        console.log(cognitoUser);

        authenticateUser(cognitoUser, authenticationDetails)
            .then(() => {
                return buildUserObject(cognitoUser)
            })
            .then((userProfileObject) => {
                res(userProfileObject)
            })
            .catch((err) => {
                console.log(err);
                rej(err)
            })
    })
    return p;
}




//export function updateUserInfo(editedInfo) {
//    const p = new Promise((res, rej) => {
//        const attributeList = [];
//        for (let a = 0; a < attrs.length; a++) {
//            if (editedInfo[attrs[a]]) {
//                let attribute = {
//                    Name: attrs[a],
//                    Value: editedInfo[attrs[a]]
//                }
//                let x = new CognitoUserAttribute(attribute);
//                attributeList.push(x);
//            }
//        }
//        const cognitoUser = config.userPool.getCurrentUser();
//        cognitoUser.getSession(function (err, result) {
//            if (result) {
//                cognitoUser.updateAttributes(attributeList, function (err, result) {
//                    if (err) {
//                        rej(err);
//                        return;
//                    }
//                    cognitoUser.getUserAttributes(function (err, result) {
//                        if (err) {
//                            rej(err);
//                            return;
//                        }
//                        buildUserObject(cognitoUser)
//                            .then((userProfileObject) => {
//                                res(userProfileObject)
//                            })
//                    })
//                });
//            }
//        });
//    })
//    return p;
//}



export function forgotPassword(email) {
    const p = new Promise((res, rej) => {

        const userData = {
            Username: email,
            Pool: config.userPool
        }
        const cognitoUser = new CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: function (result) {
                res({
                    cognitoUser: cognitoUser,
                    thirdArg: this
                })
            },
            onFailure: function (err) {
                rej(err);
            },
            inputVerificationCode: function (data) {
                res({
                    cognitoUser: cognitoUser,
                    thirdArg: this
                })
            }
        })
    })
    return p;
}



export function signOutUser() {
    const p = new Promise((res, rej) => {
        const cognitoUser = config.userPool.getCurrentUser();
        cognitoUser.signOut();
        res();
    })
    return p;
}





function authenticateUser(cognitoUser, authenticationDetails) {
    const p = new Promise((res, rej) => {

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                localStorage.setItem('user_token', result.accessToken.jwtToken);
                const loginsObj = {
                    [config.USERPOOL_ID]: result.getIdToken().getJwtToken()
                }
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: config.IDENTITY_POOL_ID,
                    Logins: loginsObj
                })
                AWS.config.credentials.refresh(function () {
                    console.log(AWS.config.credentials);
                });
                res();
            },
            onFailure: function (err) {
                rej(err);
            }
        })
    })
    return p;
}


function buildUserObject(cognitoUser) {
    console.log(cognitoUser);
    const p = new Promise((res, rej) => {
        cognitoUser.getUserAttributes(function (err, result) {
            if (err) {
                rej(err);
                return;
            }
            console.log(result);
            let userProfileObject = {};
            for (let i = 0; i < result.length; i++) {
                userProfileObject[result[i].getName()] = result[i].getValue();
            }
            userProfileObject['username'] = cognitoUser.username;
            cognitoUser.getSession(function (err, session) {
                if (err) {
                    console.log(err);
                    rej(err);
                    return;
                }
                let group = session.getIdToken().payload['cognito:groups'];
                if (group) {
                    userProfileObject['group'] = group[0];
                }
                res(userProfileObject);
            })
            
        })
    })
    return p;
}


export function retrieveUserFromLocalStorage() {
    const p = new Promise((res, rej) => {
        const cognitoUser = config.userPool.getCurrentUser();
        if (cognitoUser != null) {
            cognitoUser.getSession(function (err, session) {
                if (err) {
                    rej(err)
                    return
                }
                localStorage.setItem('user_token', session.getAccessToken().getJwtToken());
                const loginsObj = {
                    [config.USERPOOL_ID]: session.getIdToken().getJwtToken()
                };
                AWS.config.region = 'us-east-1';
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: config.IDENTITY_POOL_ID,
                    Logins: loginsObj
                });
                AWS.config.credentials.refresh(function () {
                    console.log(AWS.config.credentials);
                });
                res(buildUserObject(cognitoUser));
            });
        } else {
            rej('Failed to retrieve user from localStorage')
        }
    })
    return p
}


