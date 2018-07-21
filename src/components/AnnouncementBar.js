import React from 'react';
import { Link } from 'react-router-dom';
import AnnouncementBarStyles from '../styles/AnnounceBar.css';

class AnnouncementBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { title: '', date: null, id: null };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.announcement !== nextProps.announcement && nextProps.announcement !== null) {
            var created = new Date(nextProps.announcement.Created);
            created = created.getMonth() + 1 + "/" + created.getDate() + "/" + created.getFullYear();
            this.setState({ title: nextProps.announcement.Title, date: created, id: nextProps.announcement.idannouncements });
        }
    }

    render() {
        const { title, date, id } = this.state;
        return (
            <div className={AnnouncementBarStyles.Bar}>
                <Link className={AnnouncementBarStyles.Link} to={`/announcement/${title}/id=${id}`} >
                    <div className={AnnouncementBarStyles.Date}>{date}</div>
                    <div className={AnnouncementBarStyles.Title}>{title}</div>
                </Link>
            </div>
        );
    }
}

export default AnnouncementBar;