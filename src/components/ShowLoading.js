import React from 'react';
import Loader from 'react-loader-spinner';
import loading from '../styles/loadingStyles.css';


class ShowLoading extends React.Component {
    constructor(props) {
        super(props);

    }


    render() {
        const isLoading = this.props.loading ? loading.spinner : loading.none;

        return (
            <div className={isLoading}>
                <Loader
                    type="Oval"
                    color="lightblue"
                    height="70"
                    width="70"
                />
            </div>
        )
    }
}

export default ShowLoading;