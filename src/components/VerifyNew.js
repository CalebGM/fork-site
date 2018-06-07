import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { verify } from '../actions';
import { verifyUser } from '../api/Cognito.js';


class VerifyNew extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }
}