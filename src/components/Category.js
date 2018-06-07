import React from 'react'
import { Link } from 'react-router-dom';
import DocumentTitle from 'react-document-title';
import QuickArticleDisplay from './QuickArticleDisplay.js';
import CategoryStyles from '../styles/Category.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class Category extends React.Component {
	constructor(props) {
		super(props);
		var page = Number(props.match.params.num);
		var nextPage = (page + 1).toString();
		this.state = { articles: null, cat: props.match.params.subCat, page: page, nextPage: nextPage };
	}
	
	componentDidMount() {
		this.fetchCategoryArticles();
	}
	
	componentWillReceiveProps(nextProps) {
		if (this.props.match.params.subCat !== nextProps.match.params.subCat) {
			this.setState({ articles: null, cat: nextProps.match.params.subCat, page: '1', nextPage: '2'}, 
				() => this.fetchCategoryArticles());
		} else if (this.state.page !== nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage },
				() => this.fetchCategoryArticles());
		}
	}
	
	componentWillUnmount() {
		this.setState({});
	}
	
	
	
	fetchCategoryArticles() {
		fetch(config.url + "/getCategoryPage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ category: this.state.cat, page: this.state.page }),
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
	
	
	withoutUnderscore(cat) {
		var split = cat.split("_");
		var formatCat = split[0].charAt(0).toUpperCase() + split[0].slice(1);
		
		
		if (split[0] === 'art') {
			return 'Art/Photography';
		} else if (split[0] === 'fashion') {
			return 'Fashion/Kicks';
		}
		if (split[1]) {
			return formatCat + " " + (split[1].charAt(0).toUpperCase() + split[1].slice(1));
		}
		
		return formatCat;
	}
	
	render() {
		const { cat } = this.state;
        const formatCat = this.withoutUnderscore(cat);
		
		return (
            <DocumentTitle title={formatCat + ' - Collaboration Treehouse'}>
                <div>
			        <div className={CategoryStyles.articleList}>
				        {this.state.articles ? (
					        this.state.articles.map(article => (
						        <QuickArticleDisplay  key={article.idArticles} article={article} />
					        ))
				        ) : (
					        <div></div>
				        )}
			        </div>
			        <Link className={CategoryStyles.link} to={`/cat/${this.state.cat}/page=${this.state.nextPage}`}>
				        Next Page
			        </Link>
                </div>
		    </DocumentTitle>
		);
	}
	
	
}

export default Category;