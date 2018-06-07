import React from 'react';
import { Link } from 'react-router-dom';
import DocumentTitle from 'react-document-title';
import QuickArticleDisplay from './QuickArticleDisplay.js';
import CategoryStyles from '../styles/Category.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];


class Author extends React.Component {
	constructor(props) {
		super(props);
		var page = Number(props.match.params.num);
		var nextPage = (page + 1).toString();
		
		this.state = { articles: null, author: props.match.params.author, page: page, nextPage: nextPage };
	}
	
	
    componentDidMount() {
        console.log(this);
		this.fetchAuthorArticles();
	}
	
	
	componentWillReceiveProps(nextProps) {
		if (this.props.match.params.author !== nextProps.match.params.author) {
			this.setState({ articles: null, author: nextProps.match.params.author, page: '1', nextPage: '2'}, 
				() => this.fetchAuthorArticles());
		} else if (this.state.page !== nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage },
				() => this.fetchAuthorArticles());
		}
	}
	
	
	fetchAuthorArticles() {
		fetch(config.url + "/getAuthorPage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ author: this.state.author, page: this.state.page }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				this.setState({ articles: rs });
			})
			.catch((error) => {
				console.log(error);
			})
	}


    render() {
        const { author } = this.state;
		return (
            <DocumentTitle title={author + ' - Collaboration Treehouse'}>
			    <div className={CategoryStyles.articleList}>
				    {this.state.articles ? (
					    this.state.articles.map(article => (
						    <div key={article.idArticles}>
							    <QuickArticleDisplay  article={article} />
						    </div>
					    ))
				    ) : (
					    <div></div>
				    )}
			    </div>
			    <div>
				    <Link className={CategoryStyles.link} to={`/auth/${this.state.author}/page=${this.state.nextPage}`}>
					    Next Page
				    </Link>
			    </div>
		    </DocumentTitle>
		);
	}


}

export default Author;