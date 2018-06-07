import React from 'react';
import { DefaultDraftBlockRenderMap } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import ImageGallery from 'react-image-gallery';
import Immutable from 'immutable';
import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';

import editorStyles from '../styles/Editor.css';
import videoStyles from '../styles/Video.css';
import imageStyles from '../styles/Image.css';
import ArticleStyles from '../styles/Article.css';


const imagePlugin = createImagePlugin({ theme: imageStyles });
const focusPlugin = createFocusPlugin();
const videoPlugin = createVideoPlugin({theme: videoStyles});



const DraftImgContainer = (props) => {
	return (
		<figure className={editorStyles.videoAndImagesContainer}>
			<div className={editorStyles.videoAndImages}>{props.children}</div>
		</figure>
	)
}

const blockRenderMap = Immutable.Map({
	'atomic': {
		element: DraftImgContainer
	}
});

const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);

const plugins = [imagePlugin, focusPlugin, videoPlugin];

class Preview extends React.Component {
	constructor(props) {
		super(props);
		var cats = Array.from(props.categories);
		var created = new Date();
		created = created.getMonth()+1 + "/" + created.getDate() + "/" + created.getFullYear();
		
		var updated = new Date();
		updated = updated.getMonth()+1 + "/" + updated.getDate() + "/" + updated.getFullYear();
		
		this.state = { article: props.article, 
						title: props.title,
						categories: cats,
						author: props.author,
						images: props.images,
						created: created,
						updated: updated};
	}
	
	onChange() {
	}
	
	onScreenChange(stuff) {
		if(stuff) {
			var index = this._imageGallery.getCurrentIndex();
			console.log(index);
			var win = window.open(this.state.images[index].original, '_blank');
			if (win) {
				win.focus();
			} else {
				alert('Please allow popups for this website');
			}
		}
	}
	
	render() {
		const { images } = this.state;
		return (
			<div className={ArticleStyles.Article}>
				<div className={ArticleStyles.Title}>
					{this.state.title}
				</div>
				
				<div className={ArticleStyles.SubInfo}>
					<div className={ArticleStyles.Author}>
						<a className={ArticleStyles.Link}>
							{this.state.author}
						</a>
					</div>
					<div className={ArticleStyles.Categories}>
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
						{this.state.created}
					</div>
					<div className={ArticleStyles.Updated}>
						{this.state.updated}
					</div>
				</div>
				
				<div className={ArticleStyles.ImageBarContainer}>
					{images.length > 0 ? (
						<div className={ArticleStyles.ImageBar}>
							<ImageGallery
								items={images}
								showPlayButton={false}
								showBullets={images.length > 1 ? true : false}
								showThumbnails={false}
								showFullscreenButton={images.length > 0 ? true : false}
								ref={i => this._imageGallery = i}
								onScreenChange={this.onScreenChange.bind(this)}
							/>
						</div>
					) : (
						<div></div>
					)}
				</div>			
		
				<div className={ArticleStyles.Body}>
					<Editor 
						editorState={this.state.article} 
						plugins={plugins} 
						onChange={this.onChange} 
						blockRenderMap={extendedBlockRenderMap}
						readOnly 
					/>
					
				</div>
			</div>
		
		)
	}
}

export default Preview;