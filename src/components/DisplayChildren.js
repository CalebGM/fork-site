import React from 'react';
import { connect } from 'react-redux';
import { modifyStory } from '../actions';
import styles from '../styles/Children.css'


class DisplayChildren extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: props.childPosts

        }
    }

    componentDidMount() {

    }

    chooseBranch(nextPostTitle, nextPostId) {

        const { articleTitle, dispatch } = this.props;

        if (this.props.parentIsStart) {
            dispatch(modifyStory([{ idposts: nextPostId, Article: articleTitle, Title: nextPostTitle }]));
        } else {
            var currPosts = this.props.posts;
            var index = currPosts.findIndex(post => post.idposts === this.props.parentId);

            var newPosts = currPosts.slice(0, index + 1);

            newPosts.push({ idposts: nextPostId, Article: articleTitle, Title: nextPostTitle });

            dispatch(modifyStory(newPosts));
        }
    }

    render() {
        const { posts } = this.state;

        return (
            <div className={styles.main}>
                {posts.length ? (
                    posts.map(post => (
                        <div className={styles.linkContainer} key={post.idposts}>
                            <button className={styles.button}
                                onClick={() => { this.chooseBranch(post.Title, post.idposts) }}>
                                {post.Title}
                            </button>
                        </div>
                    ))
                ) : (
                    <div></div>
                )}
            </div>
        )
    }
}


const mapStateToProps = state => {
    return {
        posts: state.story.posts
    }
}

export default connect(mapStateToProps)(DisplayChildren)