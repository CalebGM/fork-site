import React from 'react';
import Editor, { composeDecorators } from 'draft-js-plugins-editor';
import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createResizeablePlugin from 'draft-js-resizeable-plugin';
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin';
import createColorBlockPlugin from './colorBlockPlugin';
import ModifiedVideoWrapper from './ModifiedVideoWrapper.js';
import '../Editor.css';
import '../Video.css';
import 'draft-js-inline-toolbar-plugin/lib/plugin.css';
import 'draft-js-image-plugin/lib/plugin.css';
import 'draft-js-alignment-plugin/lib/plugin.css';
import {EditorState, RichUtils, convertToRaw} from 'draft-js';
import MediaAdd from './MediaAdd.js';

const toolbarPlugin = createInlineToolbarPlugin();
const focusPlugin = createFocusPlugin();
const resizeablePlugin = createResizeablePlugin();
const alignmentPlugin = createAlignmentPlugin();


const decorator = composeDecorators(
	resizeablePlugin.decorator,
  alignmentPlugin.decorator,
  focusPlugin.decorator,
);
const imagePlugin = createImagePlugin({ decorator });
const colorBlockPlugin = createColorBlockPlugin({ decorator: decorator });
const videoPlugin = createVideoPlugin({ 
	autoHandlePastedText: true, 
	videoComponent: (props) => {
		return (
			<ModifiedVideoWrapper props={props} />
		);
	},
	decorator: decorator,
});



const videoPlugin2 = createVideoPlugin({ 
	autoHandlePastedText: true, 
	videoComponent: (props) => {
		return (
			<ModifiedVideoWrapper props={props} />
		);
	},
});
const imagePlugin2 = createImagePlugin();
const toolbarPlugin2 = createInlineToolbarPlugin();
const focusPlugin2 = createFocusPlugin();
const resizeablePlugin2 = createResizeablePlugin();
const alignmentPlugin2 = createAlignmentPlugin();





const { AlignmentTool } = alignmentPlugin;
const { InlineToolbar } = toolbarPlugin;


function mediaBlockStyleFn(contentBlock) {
	const type = contentBlock.getType();
	if (type === 'atomic') {
		return 'videoAndImages';
	}
}




const plugins = [focusPlugin, videoPlugin, alignmentPlugin, resizeablePlugin, toolbarPlugin, imagePlugin, colorBlockPlugin];
const plugins2 = [focusPlugin2, alignmentPlugin2, resizeablePlugin2, imagePlugin2, videoPlugin2];

class Publish extends React.Component {
	constructor(props) {
		super(props);
		this.state = {editorStateTitle: EditorState.createEmpty(),
						editorStateBody: EditorState.createEmpty(),
						title: '',
						category: '',
						repeat: null};
		this.onChangeTitle = (editorStateTitle) => this.setState({editorStateTitle});
		this.onChangeBody = (editorStateBody) => this.setState({editorStateBody});
		this.handleChange = this.handleChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyCommand = this.handleKeyCommand.bind(this);
	}
	
	
	handleKeyCommand(command) {
		const newState = RichUtils.handleKeyCommand(this.state.editorStateBody, command);
		if (newState) {
			this.onChangeBody(newState);
			return 'handled';
		}
		return 'not-handled';
	}
	
	handleChange(event) {
		this.setState({category: event.target.value});
	}
	
	handleTitleChange(event) {
		this.setState({title: event.target.value});
	}
	
	handleSubmit(event) {
		
	}
	
	handleSubmit2() {
		var articleContent = this.state.editorStateBody.getCurrentContent();
		var articleRaw = convertToRaw(articleContent);
		fetch("http://localhost:3001/admin/publish/postArticle",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ category: this.state.category, title: this.state.title, article: articleRaw })
		})
			.then((response) => response.json())
			.then((rs) => {
				//console.log(rs.body);
				//console.log(rs.Body.data.toString());
				this.setState({ article: rs.body });
			})
			.catch((error) => {
				console.log(error);
			});
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
	
	_onPublishClick() {
		var stuff = this.state.editorStateBody.getCurrentContent();
		console.log(convertToRaw(stuff));
		var stuffs = EditorState.createWithContent(stuff);
		var stufffs = stuffs.getCurrentContent();
		console.log(convertToRaw(stufffs));
		this.setState({repeat: stuffs});
		console.log(this);
	}
	
	_focus = () => {
		this.editor.focus();
	}
	
	render() {
		return (
		
		<div>
			<div>
				<h1>Add Your Article</h1>
			</div>
			
			<div style={{borderStyle: 'solid'}} >
				<form id="publish" onSubmit={this.handleSubmit} >
					<div>
					<fieldset>
						<label>
							Select a category for your article:	
							<input type="radio" value="movies" name="hi" checked={this.state.category === 'movies'} onChange={this.handleChange} required/>
							Movies
						</label>
						<label>
							<input type="radio" value="music" name="hi" checked={this.state.category === 'music'} onChange={this.handleChange} required/>
							Music
						</label>
						<label>
							<input type="radio" value="comics" name="hi" checked={this.state.category === 'comics'} onChange={this.handleChange} required/>
							Comics
						</label>
						<label>
							<input type="radio" value="videogames" name="hi" checked={this.state.category === 'videogames'} onChange={this.handleChange} required/>
							Video Games
						</label>
						</fieldset>
					</div>
					<div>
						<input type="text" value={this.state.title} placeholder="Give your article a unique title..." onChange={this.handleTitleChange} required />
					</div>
				</form>
			</div>
			
			
			
			<br />
			<br />
			

			
			
			<div>
				<button onClick={this._onBoldClick.bind(this)}>Bold</button>
				<button onClick={this._onItalicizeClick.bind(this)}>Italic</button>
				<button onClick={this._onVidClick.bind(this)}>Add Video</button>
				<button onClick={this._onImgClick.bind(this)}>Add Image</button>
				<button onClick={this.handleSubmit2.bind(this)}>Submit</button>
			</div>
			
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
			<div className="editor" onClick={this._focus}>
				<Editor 
					editorState = {this.state.editorStateBody} 
					handleKeyCommand={this.handleKeyCommand}
					blockStyleFn={mediaBlockStyleFn}
					onChange={this.onChangeBody} 
					plugins={plugins}
					ref={(element) => { this.editor = element; }}
					placeholder='Write the rest of your article....'
				/>
				<InlineToolbar />
				<AlignmentTool />
				
			</div>
			<br />
			<div>
				<button onClick={this._onPublishClick.bind(this)}>Publish</button>
					{this.state.repeat ? (
						<div>
							<h2> {this.state.title} </h2>
							<Editor editorState={this.state.repeat} plugins={plugins2} onChange={this.onChangeBody} readOnly='true' />
						</div>
						) : (
						<div></div>
					)}
					<input type="submit" value="submit" form="publish" />
			</div>
		</div>
		);
	}
}




	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

export default Publish;