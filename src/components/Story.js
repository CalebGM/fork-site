import React from 'react';
import DocumentTitle from 'react-document-title';
import { connect } from 'react-redux';
import { emptyStory, modifyStory } from '../actions';
import Article from './Article.js';
import Posts from './Posts.js';
import styles from '../styles/Story.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class Story extends React.Component {
    constructor(props) {
        super(props);
        var mobile = this.detectMobile();

        this.state = {
            article: props.match.params.article,
            articleId: props.match.params.id,
            postId: props.match.params.postId,
            showFull: (props.match.params.showFull === "showFull"),
            onMobile: mobile,
            tempPosts: []
        };

    }


    componentDidMount() {
        const { dispatch } = this.props;

        if (this.state.showFull && this.props.match.params.postId) {
            this.fetchPosts(this.props.match.params.postId);
        } else if (this.props.match.params.postId) {
            var newPostTitle = this.props.match.params.post;
            var newPostId = this.props.match.params.postId;
            var newPost = [{ idposts: newPostId, Article: this.state.article, Title: newPostTitle }];
            console.log('hi');
            dispatch(modifyStory(newPost));
        }

    }


    componentWillReceiveProps(nextProps) {
        const { dispatch } = this.props;
        console.log(nextProps);
        if (this.props.match.params.postId !== nextProps.match.params.postId) {
            var newPostTitle = nextProps.match.params.post;
            var newPostId = nextProps.match.params.postId;
            
            var newPost = [{ idposts: newPostId, Article: this.state.article, Title: newPostTitle }];
            
            if ((nextProps.match.params.showFull === "showFull") && nextProps.match.params.postId) {
                this.fetchPosts(nextProps.match.params.postId);
            } else {
                dispatch(modifyStory(newPost));
            }
        }


    }

    componentWillUnmount() {
        this.props.dispatch(emptyStory());
    }

    detectMobile() {
        if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)
        ) {
            return true;
        }
        else {
            return false;
        }
    }


    fetchPosts(id) {
        const { dispatch } = this.props;

        fetch(config.url + '/getParentPost',
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id
                }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                var newPosts = this.state.tempPosts;
                var post = rs.info[0];
                console.log(post);
                newPosts.unshift(post);
                console.log(newPosts);
                

                if (!post.ParentIsStart) {
                    this.setState({ tempPosts: newPosts });
                    this.fetchPosts(post.ParentId);
                }
                if (post.ParentIsStart) {
                    dispatch(modifyStory(newPosts));
                    this.setState({ finishedFetching: true });
                    
                }
            })
            .catch((error) => {
                console.log(error);
            })
    }


    showFullStory() {
        this.fetchPosts(this.props.match.params.postId);
        this.setState({ showFull: true });
    }


    //fetchPost(id) {
    //    return fetch(config.url + '/getParentPost',
    //        {
    //            method: 'post',
    //            headers: {
    //                'Content-Type': 'application/json'
    //            },
    //            body: JSON.stringify({
    //                id: id
    //            }),
    //            credentials: 'include'
    //        })
    //        .then((response) => response.json())
    //        .then((rs) => {
    //            var post = rs.info[0];
    //            newPosts.unshift(post);
    //            if (post.ParentIsStart) {
    //                atStart = true;
    //            }
    //            currentPostId = post.ParentId;
    //        })
    //        .catch((error) => {
    //            console.log(error);
    //        })
    //}

    render() {
        const { posts } = this.props;
        const { article, articleId, showFull, onMobile, postId } = this.state;
        const renderStart = (showFull || !postId);
        //console.log(renderStart);
        console.log(posts);

        return (
            <DocumentTitle title={article + ' - Collaboration Treehouse'}>
                {renderStart ? ( 
                    <div>
                        <Article className={styles.Entry} title={article} id={articleId} mobile={onMobile} mounted={renderStart} />
                    
                        {posts.length ? (
                            posts.map(post => (
                                <Posts className={styles.Entry}
                                    key={post.idposts}
                                    id={post.idposts}
                                    article={post.Article}
                                    articleId={articleId}
                                    title={post.Title}
                                    mobile={onMobile}
                                />
                            ))
                        ) : (
                            <div></div>
                        )}
                    </div>
                ) : (
                   <div>
                        <button onClick={this.showFullStory.bind(this)}>See Beginning</button>
                        {posts.length ? (
                            posts.map(post => (
                                <Posts
                                    key={post.idposts}
                                    id={post.idposts}
                                    article={post.Article}
                                    articleId={articleId}
                                    title={post.Title}
                                    mobile={onMobile}
                                />
                           ))
                       ) : (
                           <div></div>
                       )}
                   </div>
                )}
            </DocumentTitle>
        )
    }
}

const mapStateToProps = state => {
    return {
        posts: state.story.posts
    }
}

export default connect(mapStateToProps)(Story)