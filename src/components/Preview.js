import React from 'react';
import Editor from 'draft-js-plugins-editor';
import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';

import editorStyles from '../Editor.css';
import videoStyles from '../Video.css';
import imageStyles from '../Image.css';
import ArticleStyles from '../Article.css';


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

class Preview extends React.Component {
	constructor(props) {
		super(props);
		console.log(this);
		var cats = Array.from(props.categories);
		var created = new Date();
		created = created.getMonth()+1 + "/" + created.getDate() + "/" + created.getFullYear();
		
		var updated = new Date();
		updated = updated.getMonth()+1 + "/" + updated.getDate() + "/" + updated.getFullYear();
		
		this.state = { article: props.article, 
						title: props.title,
						categories: cats,
						author: props.author,
						created: created,
						updated: updated};
	}
	
	onChange() {
	}
	
	render() {
		return (
			<div className={ArticleStyles.Article}>
				<div className={ArticleStyles.Title}>
					{this.state.title}
				</div>
				
				<div className={ArticleStyles.SubInfo}>
					<div className={ArticleStyles.Author}>
						Written by: 
						<a className={ArticleStyles.Link}>
							{this.state.author}
						</a>
					</div>
					<div className={ArticleStyles.Categories}>
						Categories: 
						<ul className={ArticleStyles.CatList}>
							{this.state.categories.map(cat => (
								<li className={ArticleStyles.Category} key={cat}>
									<a className={ArticleStyles.Link} >
										{cat}
									</a>
								</li>
							))}
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
		
		)
	}
}

export default Preview;