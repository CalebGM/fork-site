import React from 'react';
import { Redirect } from 'react-router';
import { connect } from 'react-redux';


class Profile extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        const { login, username, email } = this.props;

        if (!login) {
            return <Redirect to={`/profile`} />;
        }

        return (
            <div>
                <span>This will hold the user's articles. Maybe faves?</span>
            </div>
        )
    }
}


const mapStateToProps = state => {
    return {
        login: state.user.login,
        username: state.user.username,
        email: state.user.email
    }
}

export default connect(mapStateToProps)(Profile)