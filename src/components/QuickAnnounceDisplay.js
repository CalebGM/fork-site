import React from 'react';
import { Link } from 'react-router-dom';
import quickDisplay from '../styles/QuickAnnounce.css';


class QuickAnnounceDisplay extends React.Component {
    constructor(props) {
        super(props);
        var articleInfo = this.props.article;

        var created = new Date(articleInfo.Created);
        created = created.getMonth() + 1 + "/" + created.getDate() + "/" + created.getFullYear();
        this.state = { created: created };
    }


    render() {
        const { article } = this.props;
        const { Title, idannouncements } = article;
       
        return (
            <div className={quickDisplay.Article}>
                <div className={quickDisplay.InfoContainer}>
                    <div className={quickDisplay.SubInfo}>

                        <div className={quickDisplay.Created}>
                            {this.state.created}
                        </div>
                    </div>
                    <div className={quickDisplay.Title}>
                        <Link className={quickDisplay.TitleLink} to={`/announcement/${Title}/id=${idannouncements}`}>
                            {Title}
                        </Link>
                    </div>
                    
                </div>
            </div>
        )
    }


}

export default QuickAnnounceDisplay;