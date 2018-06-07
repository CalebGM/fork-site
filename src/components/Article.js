/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import Editor from 'draft-js-plugins-editor';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import EditArticle from './EditArticle.js';
import AddPost from './AddPost.js';
import DisplayChildren from './DisplayChildren.js';
import ImageGallery from 'react-image-gallery';

import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import { DefaultDraftBlockRenderMap, EditorState, convertFromRaw } from 'draft-js';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import '!style-loader!css-loader!draft-js-linkify-plugin/lib/plugin.css';
import createLinkPlugin from 'draft-js-link-plugin';
import '!style-loader!css-loader!draft-js-link-plugin/lib/plugin.css';
import '!style-loader!css-loader!draft-js/dist/Draft.css';

import editorStyles from '../styles/Editor.css';
import videoStyles from '../styles/Video.css';
import imageStyles from '../styles/Image.css';
import ArticleStyles from '../styles/Article.css';

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
		
		return (
			// jsx-a11y/anchor-has-content
			<a {...rest} target="_blank"/>
		);
	}
});
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




const plugins = [focusPlugin, videoPlugin, linkifyPlugin, imagePlugin, linkPlugin];

class Article extends React.Component {
	constructor(props) {
		super(props);
		this.state = { article: EditorState.createEmpty(),
						ogArticle: EditorState.createEmpty(),
                        title: props.title,
                        id: props.id,
                        isMobile: props.mobile,
						categories: [],
						author: '',
						created: '',
						updated: '',
                        images: [],
                        childPosts: [],
                        inEdit: false,
                        addPost: false,
                        finished: false,
                        showNext: false,
                        unmounted: props.mounted,
                        shareFull: false,
                        mobileShowOptions: false,
                        articleUrl: encodeURI("https://collaborationtreehouse.com/story/" + props.title + "/id=" + props.id),
                        articleUrlFull: encodeURI("https://collaborationtreehouse.com/story/" + props.title + "/id=" + props.id)
					};
		this.onChange = (article) => this.setState({article});
		this.onCancel = this.onCancel.bind(this);
        this.onPublish = this.onPublish.bind(this);
	}
	
    componentDidMount() {
        window.twttr.widgets.load();
		this.fetchArticle();
	}
	
    componentWillReceiveProps(nextProps) {
        if (this.props.match && nextProps.match) {
            if (this.props.match.params.article !== nextProps.match.params.article) {
                this.setState({ title: nextProps.match.params.article },
                    () => this.fetchArticle());
            }
        }
		
	}

    componentWillUnmount() {
        this.setState({ unmounted: true });
    }
	
    fetchArticle() {
		fetch(config.url + "/getArticle",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ title: this.state.title, id: this.state.id }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				var cookedContent = convertFromRaw(JSON.parse(rs.body));
				var selArticle = EditorState.createWithContent(cookedContent);
				var articleInfo = rs.info[0];
				var newCat = [];
                for (var key in articleInfo) {
                    if (key !== "idArticles" && key !== "idposts" && key !== "User" && articleInfo[key] === 1) {
                        newCat.push(key);
                    }
                }
				
				var created = new Date(articleInfo.Created);
				created = created.getMonth()+1 + "/" + created.getDate() + "/" + created.getFullYear();
				
				var updated = new Date(articleInfo.Last_Updated);
				updated = updated.getMonth()+1 + "/" + updated.getDate() + "/" + updated.getFullYear();

                if (!this.state.unmounted) {
                    this.setState({
                        article: selArticle, ogArticle: selArticle, categories: newCat, finished: true,
                        author: articleInfo.Author, created: created, updated: updated, inEdit: false
                    });
                }
				
			})
			.catch((error) => {
				console.log(error);
			});
			
		fetch(config.url + "/getImgBarMedia",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
            body: JSON.stringify({ title: this.state.title, id: this.state.id }),
			credentials: 'include'
		})
			.then((response) => response.json())
            .then((rs) => {
                if (!this.state.unmounted) {
                    this.setState({ images: rs.images });
                }
			})
			.catch((error) => {
				console.log(error);
			});				
	}



    fetchChildren() {
        fetch(config.url + '/getChildPosts',
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: this.state.id, isStart: true }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                this.setState({ childPosts: rs.info, showNext: true });
            })
    }
	
	startEdit() {
		this.setState({ inEdit: true });
	}
	
	cancelEdit() {
		this.setState({ inEdit: false });
	}


    startAdd() {
        this.setState({ addPost: true });
    }

    cancelAdd() {
        this.setState({ addPost: false });
    }


    showNext() {
        if (this.state.childPosts.length) {
            this.setState({ showNext: true });
        } else {
            this.fetchChildren();
        }
    }

    hideNext() {
        this.setState({ showNext: false });
    }

    toggleShare() {
        var shareFull = this.state.shareFull;
        this.setState({ shareFull: !shareFull });
    }

    toggleMobileOptions() {
        var mobileShowOptions = this.state.mobileShowOptions;
        window.twttr.ready()
            .then(() => {
                window.twttr.widgets.load();
                this.setState({ mobileShowOptions: !mobileShowOptions });
            });
        
    }

    copyUrl(e) {
        var url = this.state.shareFull ? this.state.articleUrl : this.state.articleUrl;
        var textarea = document.createElement("textarea");
        var copyURL = document.createTextNode(url);
        textarea.appendChild(copyURL);
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");
        } catch (ex) {
            console.log(ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
        
    }
	
	toLink(cat) {
		var formatCat = cat;

		var slashSplit = cat.split("/");
		if (slashSplit[1]) {
			formatCat = slashSplit[0] + "_" + slashSplit[1];
		}
		
		
		var split = formatCat.split("_");
		formatCat = split[0].charAt(0).toLowerCase() + split[0].slice(1);
		if (split[1]) {
			formatCat = formatCat + "_" + (split[1].charAt(0).toLowerCase() + split[1].slice(1));
		}
		
		return formatCat;
	}
	
	withoutUnderscore(cat) {
		var split = cat.split("_");
		var formatCat = split[0].charAt(0) + split[0].slice(1);
		
		if (split[0] === 'Art') {
			return 'Art/Photography';
		} else if (split[0] === 'Fashion') {
			return 'Fashion/Kicks';
		}
		
		if (split[1]) {
			return formatCat + " " + (split[1].charAt(0) + split[1].slice(1));
		}
		
		return formatCat;
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
	
	onCancel() {
		this.cancelEdit();
	}
	
	onPublish() {
		this.fetchArticle();
	}
	
	_focus() {
		this.editor.focus();
	}
	
	
	render() {
		const { login, admin } = this.props;
        const { inEdit,
            showNext,
            addPost,
            article,
            title,
            author,
            categories,
            created,
            finished,
            images,
            childPosts,
            id,
            articleUrl,
            articleUrlFull,
            shareFull,
            mobileShowOptions,
            isMobile
        } = this.state;
        const editMode = (login && admin && inEdit);
        const mobileButton = isMobile ? ArticleStyles.MobileOptions : ArticleStyles.DisplayNone;
        const shareUrl = shareFull ? articleUrlFull : articleUrl;
        var optionsBox;
        if (isMobile && mobileShowOptions) {
            optionsBox = ArticleStyles.OptionsBoxMobile;
        } else if (isMobile && !mobileShowOptions) {
            optionsBox = ArticleStyles.DisplayNone;
        } else {
            optionsBox = ArticleStyles.OptionsBoxDesktop;
        }

        return (
            <div className={ArticleStyles.Entry}>
				{editMode ? (
						<EditArticle
							article={article}
							title={title}
							author={author}
							categories={categories}
							created={created}
							images={images}
							onCancel={this.onCancel}
							onPublish={this.onPublish}
							
						/>
				) : (
					<div >
						{login && admin ? (
							<button onClick={this.startEdit.bind(this)}>Edit/Delete Article</button>
						) : (
							<div></div>
						)}
						<div className={ArticleStyles.Article}>
						
							<div className={ArticleStyles.Title}>
								{this.state.title}
							</div>
							
							<div className={ArticleStyles.SubInfo}>
								<div className={ArticleStyles.Author}>
									<Link className={ArticleStyles.Link} to={`/auth/${this.state.author}/page=1`}>
										{this.state.author}
									</Link>
								</div>
								<div className={ArticleStyles.Categories}>
									<ul className={ArticleStyles.CatList}>
										{this.state.categories.map(cat => {
											let linkCat = this.toLink(cat);
											let formatCat = this.withoutUnderscore(cat)
											return (
												<li className={ArticleStyles.Category} key={cat}>
													<Link className={ArticleStyles.Link} to={`/cat/${linkCat}/page=1`} >
														{formatCat}
													</Link>
												</li>
											)
										})}
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
						
							<div className={ArticleStyles.Body} onClick={this._focus.bind(this)}>
								{finished ? (
								
									<Editor 
										editorState={article}
										plugins={plugins} 
										onChange={this.onChange}
										blockRenderMap={extendedBlockRenderMap}
										ref={(element) => { this.editor = element; }}
										readOnly
									/>
								) : ( <div></div>
								)}
								
							</div>
                        </div>
                        <div className={mobileButton}>
                            <span>-----------</span>
                            <button onClick={this.toggleMobileOptions.bind(this)}><i className="fa fa-sort-down"></i></button>
                            <span>-----------</span>
                        </div>
                        <div className={optionsBox} >
                                <div className={ArticleStyles.ShareBox}>
                                    <div className={ArticleStyles.ShareTabs} >
                                        <button
                                            onClick={this.toggleShare.bind(this)}
                                            disabled={!shareFull}
                                        >Share post</button>
                                        <button
                                            onClick={this.toggleShare.bind(this)}
                                            disabled={shareFull}
                                        >Share story</button>
                                    </div>
                                    <div className={ArticleStyles.ShareButtons} >
                                        <iframe
                                            src={"https://www.facebook.com/plugins/share_button.php?href=" + shareUrl + "&layout=button&size=small&mobile_iframe=true&width=59&height=20&appId"}
                                            width="59"
                                            height="20"
                                            style={{ border: 'none', overflow: 'hidden' }}
                                            scrolling="no"
                                            frameBorder="0"
                                            allowtransparency="true"
                                            allow="encrypted-media">
                                        </iframe>
                                        <a
                                            href="https://twitter.com/share"
                                            data-url={shareUrl}
                                            className="twitter-share-button"
                                            data-show-count="false"
                                            >Tweet
                                        </a>
                                        <button 
                                            className={ArticleStyles.CopyLinkLarge}
                                            onClick={this.copyUrl.bind(this)}>Copy Link
                                        </button>
                                        <button
                                            className={ArticleStyles.CopyLinkSmall}
                                            onClick={this.copyUrl.bind(this)}>URL
                                        </button>
                                    </div>
                                </div>
                            <div className={ArticleStyles.ChildBox}>
                                {showNext ? (
                                    <button 
                                        className={ArticleStyles.ChildButton} 
                                        onClick={this.hideNext.bind(this)}
                                        >
                                        Hide Next
                                    </button>
                                ) : (
                                    <button 
                                        className={ArticleStyles.ChildButton} 
                                        onClick={this.showNext.bind(this)}
                                        >
                                        Show Next
                                    </button>
                                )}
                            </div>
                            <div className={ArticleStyles.PostBox}>
                                {addPost ? (
                                    <button
                                        className={ArticleStyles.PostButton}
                                        onClick={this.cancelAdd.bind(this)}
                                        >
                                        Cancel Post
                                    </button>
                                
                                ) : (
                                    <button
                                        className={ArticleStyles.PostButton}
                                        onClick={this.startAdd.bind(this)}
                                        >
                                        Branch Off
                                    </button>
                                )}
                            </div>
                        
   

                        </div>
                        {showNext ? (
                            <div>
                                <DisplayChildren
                                    childPosts={childPosts}
                                    parentIsStart={true}
                                    articleTitle={title}
                                    articleId={id}
                                />
                            </div>
                        ) : (
                            <div></div>
                        )}
                        {addPost ? (
                            <div>
                                <AddPost title={title} parentId={id} start={true} articleId={id} />
                            </div>
                        ) : (
                            <div></div>
                        )}
					</div>
                    )}
                </div>
		)
	}
}


const mapStateToProps = state => {
	return {
        login: state.user.login,
        admin: state.user.admin
	}
}

export default connect(mapStateToProps)(Article)