export default function story(state = { posts: [] }, action) {
    switch (action.type) {
        case 'MODIFY':
            return {
                ...state,
                posts: action.newPosts
            }
        case 'EMPTY':
            return {
                ...state,
                posts: []
            }
        default:
            return state
    }
}