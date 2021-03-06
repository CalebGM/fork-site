import React from 'react';
import { Link } from 'react-router-dom';
import QuickArticleDisplay from './QuickArticleDisplay.js';
import AnnouncementBar from './AnnouncementBar.js';
import ShowLoading from './ShowLoading.js';
import styles from '../styles/Category.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];



class Home extends React.Component {
	constructor(props) {
		super(props);
		var page;
		if (props.match.params.num) {
			page = Number(props.match.params.num);
		} else {
			page = 1;
		}
        var nextPage = (page + 1).toString();
        
		
		this.state = { articles: null, announcements: null, page: page, nextPage: nextPage, loading: false };
	}
	
	
    componentDidMount() {
        this.setState({ loading: true });
        this.fetchHomeArticles();
        this.fetchAnnouncements();
	}
	
	
	
	componentWillReceiveProps(nextProps) {
		if ((this.state.page !== nextProps.match.params.num) && nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage, loading: true },
				() => this.fetchHomeArticles());
		} else if (nextProps !== this.props) {
			//this.setState({ articles: null, page: 1, nextPage: 2 },
				//() => this.fetchHomeArticles());
		}
	}
	
	
    fetchHomeArticles() {
		fetch(config.url + "/getHomePage",
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
				this.setState({ articles: rs, loading: false });
			})
			.catch((error) => {
				console.log(error);
			})
    }


    fetchAnnouncements() {
        fetch(config.url + "/getAnnouncementsPage",
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ page: 1 }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                this.setState({ announcements: rs[0] });
            })
            .catch((error) => {
                console.log(error);
            });
    }
	
	
    render() {
        const { announcements } = this.state;

		return (
		<div>
            <AnnouncementBar announcement={announcements} />
			<div className={styles.articleList}>
				{this.state.articles ? (
					this.state.articles.map(article => (
						<QuickArticleDisplay key={article.idArticles} article={article} />
					))
				) : (
					<div></div>
				)}
			</div>
			<div>
				<Link className={styles.link} to={`/page=${this.state.nextPage}`}>
					Next Page
				</Link>
			</div>
            <ShowLoading loading={this.state.loading} />
		</div>
		);
	}

}
export default Home;