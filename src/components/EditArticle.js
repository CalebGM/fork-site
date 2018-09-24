/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import { Redirect } from 'react-router';
import ShowLoading from './ShowLoading.js';

import Editor from 'draft-js-plugins-editor';
import {DefaultDraftBlockRenderMap, EditorState, ContentState, RichUtils, Modifier, convertToRaw} from 'draft-js';
import Immutable from 'immutable';

import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createToolbarPlugin from 'last-draft-js-toolbar-plugin';
import '!style-loader!css-loader!../styles/draftToolbarStyles.css';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import '!style-loader!css-loader!draft-js-linkify-plugin/lib/plugin.css';
import createLinkPlugin from 'draft-js-link-plugin';
import '!style-loader!css-loader!draft-js-link-plugin/lib/plugin.css';

import editorStyles from '../styles/Editor.css';
import videoStyles from '../styles/Video.css';
import imageStyles from '../styles/Image.css';
import '!style-loader!css-loader!draft-js-inline-toolbar-plugin/lib/plugin.css';
import 'draft-js-image-plugin/lib/plugin.css';

import MediaAdd from './MediaAdd.js';
import LogoAdd from './LogoAdd.js';
import ImageBar from './ImageBar.js';
import Preview from './Preview.js';


var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

const linkPlugin = createLinkPlugin({
	component: (props) => {
		const { contentState, ...rest} = props;
		// jsx-a11y/anchor-has-content
		return (<a {...rest} target="_blank"/>);
	}
});
const linkifyPlugin = createLinkifyPlugin({
	component: (props) => {
		const { contentState, ...rest} = props;
		// jsx-a11y/anchor-has-content
		return (<a {...rest} target="_blank"/>);
	}
});
const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;
const focusPlugin = createFocusPlugin();
const imagePlugin = createImagePlugin({ theme: imageStyles });
const videoPlugin = createVideoPlugin({theme: videoStyles})

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


const plugins = [focusPlugin, videoPlugin, toolbarPlugin, linkifyPlugin, imagePlugin, linkPlugin];
const categories = config.categories;
const tabCharacter = "	";


class EditArticle extends React.Component {
	constructor(props) {
		super(props);
		var category = new Set(props.categories);
		if (category.has('Art_Photography')) {
			category.delete('Art_Photography');
			category.add('Art/Photography');
		}
		if (category.has('Fashion_Kicks')) {
			category.delete('Fashion_Kicks');
			category.add('Fashion/Kicks');
        }

        
		this.state = {editorStateBody: props.article,
						ogTitle: props.title,
						title: props.title,
						author: props.author,
                        id: props.id,
						category: category,
						logoImg: { original: config.articleUrl + props.id + "-" + props.title + '/logo' },
						images: props.images,
						preview: false,
						finishPublish: false,
						deleteRedirect: false,
						fetches: {},
                        loading: false
					};
						
		this.onChangeBody = (editorStateBody) => this.setState({editorStateBody});
		this.createCheckbox = this.createCheckbox.bind(this);
		this.modifyLogo = this.modifyLogo.bind(this);
		this.modifyImageBar = this.modifyImageBar.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleAuthorChange = this.handleAuthorChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyCommand = this.handleKeyCommand.bind(this);
		this.handlePastedText = this.handlePastedText.bind(this);
		this.onTab = this.onTab.bind(this);
	}
	
	
	handleKeyCommand(command) {
		const newState = RichUtils.handleKeyCommand(this.state.editorStateBody, command);
		if (newState) {
			this.onChangeBody(newState);
			return 'handled';
		}
		return 'not-handled';
	}
	
	
	onTab(e) {
		e.preventDefault();

		let currentState = this.state.editorStateBody;
		let newContentState = Modifier.replaceText(
		  currentState.getCurrentContent(),
		  currentState.getSelection(),
		  tabCharacter
		);

		this.setState({editorStateBody: EditorState.push(currentState, newContentState, 'insert-characters')});
	}
	
	
	handlePastedText(text) {
		const { editorStateBody } = this.state;
		const pastedBlocks = ContentState.createFromText(text).blockMap;
		const newState = Modifier.replaceWithFragment(
			editorStateBody.getCurrentContent(),
			editorStateBody.getSelection(),
			pastedBlocks
		);
		this.onChangeBody(EditorState.push(editorStateBody, newState, 'insert-fragment'));
		return 'handled';
	}
	
	handleChange(event) {
		var newCat = this.state.category;
		if(newCat.has(event.target.value)) {
			newCat.delete(event.target.value);
			this.setState({category: newCat});
		} else {
			newCat.add(event.target.value);
			this.setState({category: newCat});
		}
	}
	
	handleTitleChange(event) {
		this.setState({title: event.target.value});
	}
	
	handleAuthorChange(event) {
		this.setState({author: event.target.value});
	}
	
	handleSubmit(event) {
        event.preventDefault();
		var checkboxes = document.querySelectorAll('input[type="checkbox"]');
		var checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
		if (!checkedOne) {
			alert('Please check at least one category');
        } else {
            this.setState({ loading: true });
			var myForm = document.getElementById('publish');
			var formData = new FormData(myForm);
			var articleContent = this.state.editorStateBody.getCurrentContent();
			
            var ogTitle = this.state.ogTitle;
            var id = this.state.id;
			var cats = formData.getAll('cat');
			var title = formData.get('title');
			var author = formData.get('author');
			var firstBlock = articleContent.getFirstBlock();
			var nextBlock = articleContent.getBlockAfter(firstBlock.key);
			
			while (nextBlock) {
				let key = nextBlock.getEntityAt(0);
				if (key) {
					let entity = articleContent.getEntity(key);
					if (entity.type === "image") {
						let uploadUrl = config.articleUrl + id + '-' + title + "/artmedia";
						let imageUrl = entity.data.src;
						let imageBaseUrl = imageUrl.substring(0, imageUrl.lastIndexOf('/'));
						
						if (uploadUrl !== imageBaseUrl) {
							let fetches = this.state.fetches;
							fetches[key] = entity;
							this.setState({ fetches: fetches });
						}
					}
				}
				nextBlock = articleContent.getBlockAfter(nextBlock.key);
			}
			
			
			var fetches = this.state.fetches;
			var promises = [];
			for (var key in fetches) {
				let request = this.uploadDraftImage(key, fetches, articleContent);
				promises.push(request);
			}
			
            if (this.state.logoImg) {
                var logoImgRequest = this.uploadLogoImage();
                promises.push(logoImgRequest);
            }
			
            if (this.state.images.length > 0) {
                for (var i = 0; i < this.state.images.length; i++) {
                    let imgBarRequest = this.uploadImgBar(this.state.images[i]);
                    promises.push(imgBarRequest);
                }
            }
			
			Promise.all(promises).then(() => {
				var articleContentImg = this.state.editorStateBody.getCurrentContent();
                var articleRaw = convertToRaw(articleContentImg);
                var imageKeys = [];
                for (var i = 0; i < this.state.images.length; i++) {
                    if (this.state.images[i].file) {
                        imageKeys.push(id + '-' + title + '/media/' + this.state.images[i].file.name)
                    } else {
                        let imageSplit = this.state.images[i].original.split('/');
                        let imgFileName = id + '-' + title + '/media/' + imageSplit[imageSplit.length - 1];
                        imageKeys.push(imgFileName);
                    }
                }
				fetch(config.url + "/admin/publish/updateContent",
				{
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
                    body: JSON.stringify({
                        categories: cats,
                        title: title,
                        id: id,
                        ogTitle: ogTitle,
                        author: author,
                        content: articleRaw,
                        source: "Article",
                        imgBar: imageKeys

                    }),
					credentials: 'include'
				})
					.then((response) => {
						this.setState({ finishPublish: true, loading: false });
					})
					.catch((error) => {
						console.log(error);
					});
			});
		}
	}
	
	
    uploadLogoImage() {
        const { logoImg, title, id } = this.state;
        var junkBlob = new Blob(['sup'], { type: 'text/plain' });

        if (logoImg.file) {
            let localFile = new FormData();
            localFile.append('file', logoImg.file, 'logo');
            localFile.append('title', junkBlob, title);
            localFile.append('id', junkBlob, id);
            localFile.append('logo', junkBlob);
            localFile.append('article', junkBlob);

            return fetch(config.url + "/admin/publish/uploadLocalImage",
                {
                    method: 'post',
                    body: localFile,
                    credentials: 'include'
                })
                .then((response) => response.json())
                .then((rs) => {
                })
                .catch((error) => {
                    console.log(error);
                });
        } else {
            return fetch(config.url + "/admin/publish/uploadImage",
                {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: logoImg.original, title: title, id: id, logo: true, source: "Article" }),
                    credentials: 'include'
                })
                .then((response) => response.json())
                .then((rs) => {
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }


    uploadImgBar(image) {
        const { title, id } = this.state;
        var junkBlob = new Blob(['sup'], { type: 'text/plain' });
        if (image.file) {
            let localFile = new FormData();
            localFile.append('file', image.file.image);
            localFile.append('fileName', junkBlob, image.file.name);
            localFile.append('title', junkBlob, title);
            localFile.append('id', junkBlob, id);
            localFile.append('imgBar', junkBlob);
            localFile.append('article', junkBlob);

            return fetch(config.url + "/admin/publish/uploadLocalImage",
                {
                    method: 'post',
                    body: localFile,
                    credentials: 'include'
                })
                .then((response) => response.json())
                .then((rs) => {
                })
                .catch((error) => {
                    console.log(error);
                });
        } else {
            let uploadUrl = config.articleUrl + id + '-' + title + "/media";
            let imageUrl = image.original;
            let imageBaseUrl = imageUrl.substring(0, imageUrl.lastIndexOf('/'));

            if (uploadUrl !== imageBaseUrl) {
                return fetch(config.url + "/admin/publish/uploadImage",
                    {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ url: image.original, title: title, id: id, imgBar: true, source: "Article" }),
                        credentials: 'include'
                    })
                    .then((response) => response.json())
                    .then((rs) => {
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } else {
                return Promise.resolve();
            }
        }

    }

    uploadDraftImage(key, entityObject, articleContent) {
        const { title, id } = this.state;
        let entity = entityObject[key];
        let oldUrl = entity.data.src;
        var junkBlob = new Blob(['sup'], { type: 'text/plain' });
        console.log(entity.data.file);
        if (entity.data.file) {
            let localFile = new FormData();
            localFile.append('file', entity.data.file.image);
            localFile.append('fileName', junkBlob, entity.data.file.name);
            localFile.append('title', junkBlob, title);
            localFile.append('id', junkBlob, id);
            localFile.append('draft', junkBlob);
            localFile.append('article', junkBlob);

            return fetch(config.url + "/admin/publish/uploadLocalImage",
                {
                    method: 'post',
                    body: localFile,
                    credentials: 'include'
                })
                .then((response) => response.json())
                .then((rs) => {
                    articleContent = articleContent.replaceEntityData(key, { src: rs.url, file: null });
                    let newArticle = EditorState.createWithContent(articleContent);

                    this.setState({ editorStateBody: newArticle });
                })
                .catch((error) => {
                    console.log(error);
                });
        } else {
            return fetch(config.url + "/admin/publish/uploadImage",
                {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: oldUrl, title: title, id: id, draft: true, source: "Article" }),
                    credentials: 'include'
                })
                .then((response) => response.json())
                .then((rs) => {
                    articleContent = articleContent.replaceEntityData(key, { src: rs.url, file: null });
                    let newArticle = EditorState.createWithContent(articleContent);

                    this.setState({ editorStateBody: newArticle });
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
	
	
	createCheckbox(label) {
		return (
			<div className={editorStyles.checkboxes} key={categories.indexOf(label)}>
				<label>	
					<input type="checkbox" name="cat" value={label} checked={this.state.category.has(label)} onChange={this.handleChange} />
						{label}
				</label>
			</div>
		);
		
	}
	
	createCheckboxes() {
		return categories.map(this.createCheckbox);
	}
	
	
	_onBoldClick() {
		this.onChangeBody(RichUtils.toggleInlineStyle(this.state.editorStateBody, 'BOLD'));
	}
	
	_onItalicizeClick() {
		this.onChangeBody(RichUtils.toggleInlineStyle(this.state.editorStateBody, 'ITALIC'));
	}
	
	_onVidClick() {
		this.onChangeBody(videoPlugin.addVideo(this.state.editorStateBody, {src: 'https://www.youtube.com/watch?v=Ba1BWuiOVEs'}));
	}
	
	_onImgClick() {
		this.onChangeBody(imagePlugin.addImage(this.state.editorStateBody, 'http://static.lakana.com/media.fox5ny.com/photo/2017/05/11/redfoxfamily%20_OP_3_CP__1494549624513_3298485_ver1.0_640_360.jpg'));
	}
	
	_onPreviewClick() {
		this.setState({ preview: true });
	}
	
	_onEditClick() {
		this.setState({ preview: false });
	}
	
	_onDeleteClick() {
		var result = window.confirm("Are you sure you want to delete this article?");
		if (result) {
			fetch(config.url + "/admin/publish/deleteContent",
			{
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ key: this.state.ogTitle, id: this.state.id, source: "Article" }),
				credentials: 'include'
			})
				.then((response) => {
					if(response.status === 200) {
						this.setState({ deleteRedirect: true });
						alert("Article Successfully Deleted");
					}
				})
				.catch((error) => {
					console.log(error);
				})
					
		}
	}
	
	_focus = () => {
		this.editor.focus();
	}
	
	modifyLogo(newLogo) {
		this.setState({ logoImg: newLogo });
	}
	
	modifyImageBar(newImages) {
        console.log(newImages);
		this.setState({ images: newImages });
		console.log(this.state.images);
	}
	
	render() {
		const { onCancel, onPublish } = this.props;
        const { finishPublish, title, ogTitle, deleteRedirect } = this.state;
        
		
		if (finishPublish && (title !== ogTitle)) {
			return <Redirect to={`/story/${title}`} />;
		} else if (finishPublish) {
			onPublish();
		} else if (deleteRedirect) {
			return <Redirect to={`/`} />
		}
			
			
		
	
		return (
			<div className={editorStyles.publishBody} >
				{this.state.preview ? (
					<div>
						<Preview 
							article={this.state.editorStateBody}
							title={this.state.title}
							categories={this.state.category}
							author={this.state.author}
							images={this.state.images}
						/>
						<div style={{textAlign: 'left'}}>
							<button onClick={this._onEditClick.bind(this)}>Back to Edits</button>
						</div>
					</div>
				) : (
					<div>
						<div style={{display: 'flex', justifyContent: 'space-between'}}>
							<div>
								<h1>Edit Your Article</h1>
							</div>
							<div style={{paddingTop: '24px'}}>
								<button style={{fontSize: '18px'}} onClick={this._onDeleteClick.bind(this)}>Delete Article</button>
							</div>
							
						</div>
						
						<form className={editorStyles.form} name="publish" id="publish" onSubmit={this.handleSubmit} >
							
							<input className={editorStyles.TitleInput}
								type="text"
								name="title"
								value={this.state.title}
								placeholder="Give your article a unique title..."
								onChange={this.handleTitleChange}
								required 
							/>
							<div className={editorStyles.SubInfo}>
								<div className={editorStyles.AuthorInput}>
									<input type="text"
										name="author"
										value={this.state.author}
										placeholder="Write the author's name..."
										onChange={this.handleAuthorChange}
										required
									/>
								</div>
								<fieldset className={editorStyles.checkField} >
									{this.createCheckboxes()}	
								</fieldset>
							</div>
						</form>
						
						<div className={editorStyles.PictureSpace}>
							<div className={editorStyles.LogoAdd}>
								<LogoAdd
									onChange={this.modifyLogo}
									logo={this.state.logoImg}
								/>
							</div>
							<div className={editorStyles.ImageBarAdd}>
								<ImageBar
									onChange={this.modifyImageBar}
									images={this.state.images}
								/>
							</div>
						</div>
						
						<br />
						<br />
						
						<div className={editorStyles.buttons}>
							<button className={editorStyles.button} onClick={this._onBoldClick.bind(this)}>Bold</button>
							<button className={editorStyles.button} onClick={this._onItalicizeClick.bind(this)}>Italic</button>
							<button className={editorStyles.button} onClick={this._onVidClick.bind(this)}>Add Test Video</button>
							<button className={editorStyles.button} onClick={this._onImgClick.bind(this)}>Add Test Image</button>
							<MediaAdd
								editorState={this.state.editorStateBody}
								onChange={this.onChangeBody}
								modifier={imagePlugin.addImage}
								type="image"
							/>
							<MediaAdd
								editorState={this.state.editorStateBody}
								onChange={this.onChangeBody}
								modifier={videoPlugin.addVideo}
								type="video"
							/>
						</div>

						<div className={editorStyles.editor} >
							<Editor 
								editorState = {this.state.editorStateBody} 
								handleKeyCommand={this.handleKeyCommand}
								handlePastedText={this.handlePastedText}
								onTab={this.onTab}
								blockRenderMap={extendedBlockRenderMap}
								onChange={this.onChangeBody} 
								plugins={plugins}
								textAlign='left'
								//ref={(element) => { this.editor = element; }}
								placeholder='Write the rest of your article.....'
							/>
							<Toolbar />
						</div>
						
						<div>
							<div style={{display: 'inline-block', float: 'left'}}>
								<button onClick={() => onCancel()}>Cancel Edits</button>
							</div>
							<div style={{display: 'inline-block', float: 'right'}}>
								<div style={{display: 'inline-block', paddingRight: '10px'}}>
									<button onClick={this._onPreviewClick.bind(this)}>Preview Article</button>
								</div>
								<div style={{display: 'inline-block'}}>
									<input type="submit" value="Submit Article" form="publish" />
								</div>
							</div>
						</div>
                        <ShowLoading loading={this.state.loading} />
					</div>
				)}
			</div>		
		);
	}
}	
	

export default EditArticle;