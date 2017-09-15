import React from 'react';
import { Link } from 'react-router-dom';
import quickDisplay from '../QuickArticle.css';


class QuickArticleDisplay extends React.Component {
	constructor(props) {
		super(props);
		this.state = { categories: [] };
	}
	
	componentDidMount() {
		var articleInfo = this.props.article;
		var newCat = this.state.categories;
		for (var key in articleInfo) {
			if (articleInfo[key] === 1) {
				newCat.push(key);
			}
		}
		
		var created = new Date(articleInfo.Created);
		created = created.getMonth()+1 + "/" + created.getDate() + "/" + created.getFullYear();
		this.setState({ categories: newCat, created: created });
		
	}
	
	
	
	render() {
		return (
			<div className={quickDisplay.Article}>
				<div className={quickDisplay.Title}>
					<Link className={quickDisplay.TitleLink} to={`/story/${this.props.article.Title}`}>
						{this.props.article.Title}
					</Link>
				</div>
				<div className={quickDisplay.SubInfo}>
					<div className={quickDisplay.Author}>
						Written by: 
						<Link to={`/auth/${this.props.article.Author}/page=1`}>
							{this.props.article.Author}
						</Link>
					</div>
					<div className={quickDisplay.Categories}>
						Categories: 
						<ul className={quickDisplay.CatList}>
							{this.state.categories.map(cat => (
								<li className={quickDisplay.Category} key={cat}>
									<Link className={quickDisplay.CatLink} to={`/cat/${cat}/page=1`} >
										{cat}
									</Link>
								</li>
								
							))}
						</ul>
					</div>
					<div className={quickDisplay.Created}>
						Posted:
						{this.state.created}
					</div>
				</div>
			</div>
		)
	}
	
	
}

export default QuickArticleDisplay;