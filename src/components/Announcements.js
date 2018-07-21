import React from 'react'
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';
import AddAnnouncement from './AddAnnouncement.js';
import QuickAnnounceDisplay from './QuickAnnounceDisplay.js';
import CategoryStyles from '../styles/Category.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class Announcements extends React.Component {
	constructor(props) {
		super(props);
		var page = Number(props.match.params.num);
		var nextPage = (page + 1).toString();
		this.state = { articles: null, page: page, nextPage: nextPage };
	}
	
	componentDidMount() {
		this.fetchAnnouncements();
	}
	
	componentWillReceiveProps(nextProps) {
		if (this.state.page !== nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage },
				() => this.fetchAnnouncements());
		}
	}
	
	componentWillUnmount() {
		this.setState({});
	}
	
	
	
	fetchAnnouncements() {
	    fetch(config.url + "/getAnnouncementsPage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ page: this.state.page }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				this.setState({ articles: rs });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	render() {
		return (
		    <DocumentTitle title={'Announcements - Collaboration Treehouse'}>
				<div>
                    <AddAnnouncement />
					<div className={CategoryStyles.articleList}>
				{this.state.articles ? (
							this.state.articles.map(article => (
								<QuickAnnounceDisplay key={article.idannouncements} article={article} />
							))
						) : (
							<div></div>
						)}
					</div>
					<Link className={CategoryStyles.link} to={`/announcements/page=${this.state.nextPage}`}>
						Next Page
					</Link>
				</div>
			</DocumentTitle>
		);
	}
		
}

const mapStateToProps = state => {
	return {
		login: state.user.login,
		admin: state.user.admin
	}
}

export default connect(mapStateToProps)(Announcements)