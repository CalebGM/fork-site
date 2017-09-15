import React from 'react';
import Editor from 'draft-js-plugins-editor';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import EditArticle from './EditArticle.js';

import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import { EditorState, convertFromRaw } from 'draft-js';

import editorStyles from '../Editor.css';
import videoStyles from '../Video.css';
import imageStyles from '../Image.css';
import ArticleStyles from '../Article.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

const imagePlugin = createImagePlugin({ theme: imageStyles });
const focusPlugin = createFocusPlugin();
const videoPlugin = createVideoPlugin({theme: videoStyles});



function mediaBlockStyleFn(contentBlock) {
	const type = contentBlock.getType();
	if (type === 'atomic') {
		return editorStyles.videoAndImages;
	}
}

const plugins = [imagePlugin, focusPlugin, videoPlugin];

class Article extends React.Component {
	constructor(props) {
		super(props);
		this.state = { article: EditorState.createEmpty(),
						ogArticle: EditorState.createEmpty(),
						title: props.match.params.article,
						categories: [],
						author: '',
						created: '',
						updated: '',
						inEdit: false
					};
		this.onPublish = this.onPublish.bind(this);
	}
	
	componentDidMount() {
		this.fetchArticle();
	}
	
	
	fetchArticle() {
		fetch(config.url + "/getArticle",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ key: this.state.title }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				console.log(rs);
				var cookedContent = convertFromRaw(JSON.parse(rs.body));
				console.log(cookedContent);
				var selArticle = EditorState.createWithContent(cookedContent);
				
				var articleInfo = rs.info[0];
				var newCat = [];
				for (var key in articleInfo) {
					if (articleInfo[key] === 1) {
						newCat.push(key);
					}
				}
				
				var created = new Date(articleInfo.Created);
				created = created.getMonth()+1 + "/" + created.getDate() + "/" + created.getFullYear();
				
				var updated = new Date(articleInfo.Last_Updated);
				updated = updated.getMonth()+1 + "/" + updated.getDate() + "/" + updated.getFullYear();
				
				this.setState({ article: selArticle, ogArticle: selArticle, categories: newCat, 
								author: articleInfo.Author, created: created, updated: updated, inEdit: false });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	
	startEdit() {
		this.setState({ inEdit: true });
	}
	
	cancelEdit() {
		this.setState({ inEdit: false });
	}
	
	
	toLower(cat) {
		var split = cat.split("_");
		var formatCat = split[0].charAt(0).toLowerCase() + split[0].slice(1);
		
		if (split[1]) {
			return formatCat + "_" + (split[1].charAt(0).toLowerCase() + split[1].slice(1));
		}
		
		return formatCat;
	}
	
	onChange() {
	}
	
	onPublish() {
		this.fetchArticle();
	}
	
	render() {
		const { login } = this.props;
		const { inEdit, article, title, author, categories, created } = this.state;
		const editMode = (login && inEdit);
		
		
		return (
			<div>
				{editMode ? (
					<div>
						<EditArticle
							article={article}
							title={title}
							author={author}
							categories={categories}
							created={created}
							onPublish={this.onPublish}
							
						/>
						<button onClick={this.cancelEdit.bind(this)}>Cancel Edits</button>
					</div>
				) : (
					<div>
						{login ? (
							<button onClick={this.startEdit.bind(this)}>Edit Article</button>
						) : (
							<div></div>
						)}
						<div className={ArticleStyles.Article}>
						
							<div className={ArticleStyles.Title}>
								{this.state.title}
							</div>
							
							<div className={ArticleStyles.SubInfo}>
								<div className={ArticleStyles.Author}>
									Written by: 
									<Link to={`/auth/${this.state.author}/page=1`}>
										{this.state.author}
									</Link>
								</div>
								<div className={ArticleStyles.Categories}>
									Categories: 
									<ul className={ArticleStyles.CatList}>
										{this.state.categories.map(cat => {
											let lowerCat = this.toLower(cat);
											console.log(lowerCat);
											return (
												<li className={ArticleStyles.Category} key={cat}>
													<Link className={ArticleStyles.Link} to={`/cat/${lowerCat}/page=1`} >
														{cat}
													</Link>
												</li>
											)
										})}
									</ul>
								</div>
								<div className={ArticleStyles.Created}>
									Posted:
									{this.state.created}
								</div>
								<div className={ArticleStyles.Updated}>
									Last Updated:
									{this.state.updated}
								</div>
							</div>
						
							<div className={ArticleStyles.Body}>
								<Editor 
									editorState={this.state.article} 
									plugins={plugins} 
									onChange={this.onChange} 
									blockStyleFn={mediaBlockStyleFn}
									readOnly 
								/>
								
							</div>
						</div>
					</div>
				)}
			</div>		
		)
	}
}


const mapStateToProps = state => {
	return {
		login: state.login
	}
}

export default connect(mapStateToProps)(Article)